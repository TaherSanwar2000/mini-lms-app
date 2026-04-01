import { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useCourseStore } from '../../src/store/courseStore';
import { useAuthStore } from '../../src/store/authStore';

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildCourseHTML(params: {
  title: string;
  description: string;
  instructor: string;
  category: string;
  rating: number;
  price: string;
  thumbnail: string;
  isEnrolled: boolean;
  username: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>${params.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0F172A;
      color: #F1F5F9;
      padding: 24px 20px;
      line-height: 1.6;
    }
    .hero {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: rgba(99,102,241,0.2);
      color: #818CF8;
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
      margin-bottom: 12px;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
    .instructor { color: #94A3B8; font-size: 14px; margin-bottom: 20px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #CBD5E1; }
    .description { color: #94A3B8; font-size: 15px; line-height: 1.7; }
    .progress-bar {
      background: #1E293B;
      border-radius: 8px;
      height: 8px;
      margin-top: 8px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 8px;
      background: linear-gradient(90deg, #6366F1, #818CF8);
      width: 0%;
      transition: width 1.2s ease;
    }
    .btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      margin-top: 8px;
    }
    .btn-primary { background: #6366F1; color: white; }
    .btn-primary:active { opacity: 0.8; }
    .btn-secondary {
      background: transparent;
      color: #94A3B8;
      border: 1px solid #334155;
    }
    .enrolled-badge {
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.3);
      color: #4ADE80;
      border-radius: 12px;
      padding: 10px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .module {
      background: #1E293B;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .module-icon { font-size: 20px; }
    .module-title { font-size: 14px; font-weight: 500; }
    .module-duration { font-size: 12px; color: #64748B; margin-top: 2px; }
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #4ADE80; color: #0F172A; border-radius: 20px;
      padding: 10px 20px; font-weight: 600; font-size: 14px;
      opacity: 0; transition: opacity 0.3s; white-space: nowrap;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <img class="hero" src="${params.thumbnail}" alt="${params.title}" onerror="this.style.display='none'" />
  <div class="badge">${params.category}</div>
  <h1>${params.title}</h1>
  <p class="instructor">👨‍🏫 ${params.instructor} &nbsp;·&nbsp; ⭐ ${params.rating.toFixed(1)}&nbsp;·&nbsp; 💰 ${params.price}</p>

  ${params.isEnrolled ? '<div class="enrolled-badge">✅ You are enrolled in this course</div>' : ''}

  <div class="section">
    <h2>About</h2>
    <p class="description">${params.description}</p>
  </div>

  <div class="section">
    <h2>Your Progress</h2>
    <p style="color:#94A3B8;font-size:14px;" id="progress-label">0% completed</p>
    <div class="progress-bar">
      <div class="progress-fill" id="progress-fill"></div>
    </div>
  </div>

  <div class="section">
    <h2>Course Modules</h2>
    ${['Introduction & Overview', 'Core Concepts', 'Hands-on Practice', 'Advanced Topics', 'Final Assessment']
      .map(
        (m, i) => `
      <div class="module">
        <span class="module-icon">${['📖','🎯','🛠️','🚀','🏆'][i]}</span>
        <div>
          <div class="module-title">${m}</div>
          <div class="module-duration">${[15, 30, 45, 30, 20][i]} min</div>
        </div>
      </div>`,
      )
      .join('')}
  </div>

  <button class="btn btn-primary" onclick="markProgress()">Continue Learning</button>

  <div class="toast" id="toast">Progress saved! 🎉</div>

  <script>
    let progress = 0;

    window.addEventListener('message', function(e) {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'SET_PROGRESS') {
          progress = msg.value;
          document.getElementById('progress-fill').style.width = progress + '%';
          document.getElementById('progress-label').textContent = progress + '% completed';
        }
        if (msg.type === 'UPDATE_ENROLLMENT') {
          location.reload();
        }
      } catch(err) {}
    });

    function sendToNative(action, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action, data }));
    }

    function markProgress() {
      progress = Math.min(progress + 20, 100);
      document.getElementById('progress-fill').style.width = progress + '%';
      document.getElementById('progress-label').textContent = progress + '% completed';
      showToast();
      sendToNative('progress_update', { progress });
    }

    function showToast() {
      const t = document.getElementById('toast');
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    // Animate progress bar on load
    setTimeout(() => {
      document.getElementById('progress-fill').style.width = '0%';
    }, 300);
  </script>
</body>
</html>`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CourseWebViewScreen() {
  const { courseId, title } = useLocalSearchParams<{ courseId: string; title: string }>();
  const webViewRef = useRef<WebView>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const courses = useCourseStore((s) => s.courses);
  const user = useAuthStore((s) => s.user);
  const course = courses.find((c) => String(c.id) === courseId);

  // Inject auth + course state into WebView
  const injectedJS = `
    window.nativeContext = {
      username: "${user?.username ?? ''}",
      courseId: "${courseId}",
      isEnrolled: ${course?.isEnrolled ?? false},
    };
    window.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify({ type: 'SET_PROGRESS', value: ${course?.progress ?? 0} })
    }));
    true;
  `;

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          action: string;
          data?: { progress?: number };
        };

        if (msg.action === 'close') {
          // router.back() can be called here if needed
        }
      } catch {
        // Malformed message - ignore
      }
    },
    [],
  );

  if (!course) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-white">Course not found</Text>
      </View>
    );
  }

  const html = buildCourseHTML({
    title: course.title,
    description: course.description,
    instructor: course.instructorName ?? 'Unknown',
    category: course.category,
    rating: course.rating,
    price: `$${(course.price * (1 - course.discountPercentage / 100)).toFixed(2)}`,
    thumbnail: course.thumbnail,
    isEnrolled: course.isEnrolled ?? false,
    username: user?.username ?? '',
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: title ?? 'Course Content',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        {isLoading && !loadError && (
          <Animated.View
            entering={FadeIn}
            className="absolute inset-0 z-10 items-center justify-center bg-surface"
          >
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-gray-400 mt-3 text-sm">Loading course content...</Text>
          </Animated.View>
        )}

        {loadError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text style={{ fontSize: 48 }} className="mb-4">🌐</Text>
            <Text className="text-white text-xl font-semibold text-center mb-2">
              Failed to load content
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-6">
              There was a problem loading the course page. Please try again.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setLoadError(false);
                setIsLoading(true);
                webViewRef.current?.reload();
              }}
              className="bg-primary-500 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html }}
            injectedJavaScript={injectedJS}
            onMessage={handleMessage}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setLoadError(true);
              setIsLoading(false);
            }}
            onHttpError={() => {
              setLoadError(true);
              setIsLoading(false);
            }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            style={{ flex: 1, backgroundColor: '#0F172A' }}
          />
        )}
      </SafeAreaView>
    </>
  );
}