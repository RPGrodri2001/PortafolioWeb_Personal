/* ================================
   SERVICE WORKER
   Cache y funcionalidad offline
   ================================ */

const CACHE_NAME = 'gino-portfolio-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMAGE_CACHE = 'images-v1';

// Archivos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/main.js',
  '/manifest.json',
  '/imagen/FotoCV.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  // CDN Resources
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap'
];

// URLs que siempre deben ir a la red
const NETWORK_ONLY = [
  '/api/',
  '/analytics/',
  'https://www.google-analytics.com/',
  'https://analytics.google.com/'
];

// ========== INSTALACIÓN ==========
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    (async () => {
      try {
        // Abrir cache estático
        const staticCache = await caches.open(STATIC_CACHE);
        
        // Cachear archivos críticos primero
        const criticalAssets = STATIC_ASSETS.filter(asset => 
          asset.includes('index.html') || 
          asset.includes('main.js') || 
          asset.includes('variables.css') ||
          asset === '/'
        );
        
        await staticCache.addAll(criticalAssets);
        console.log('✅ Archivos críticos cacheados');
        
        // Cachear el resto de archivos en background
        setTimeout(async () => {
          try {
            const remainingAssets = STATIC_ASSETS.filter(asset => 
              !criticalAssets.includes(asset)
            );
            await staticCache.addAll(remainingAssets);
            console.log('✅ Todos los archivos estáticos cacheados');
          } catch (error) {
            console.warn('⚠️ Error cacheando archivos secundarios:', error);
          }
        }, 1000);
        
        // Forzar activación inmediata
        self.skipWaiting();
        
      } catch (error) {
        console.error('❌ Error durante la instalación:', error);
      }
    })()
  );
});

// ========== ACTIVACIÓN ==========
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    (async () => {
      try {
        // Limpiar caches antiguos
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name !== STATIC_CACHE && 
          name !== DYNAMIC_CACHE && 
          name !== IMAGE_CACHE &&
          name !== CACHE_NAME
        );
        
        await Promise.all(
          oldCaches.map(name => {
            console.log(`🗑️ Eliminando cache antiguo: ${name}`);
            return caches.delete(name);
          })
        );
        
        // Tomar control de todas las páginas
        await self.clients.claim();
        
        console.log('✅ Service Worker activado y controlando las páginas');
        
        // Notificar a las páginas que el SW está listo
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Service Worker activado correctamente'
          });
        });
        
      } catch (error) {
        console.error('❌ Error durante la activación:', error);
      }
    })()
  );
});

// ========== ESTRATEGIA DE FETCH ==========
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar peticiones GET
  if (request.method !== 'GET') return;
  
  // Excluir URLs específicas
  if (NETWORK_ONLY.some(pattern => url.href.includes(pattern))) {
    return;
  }
  
  // Estrategia según el tipo de recurso
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (url.pathname.match(/\.(css|js)$/) || STATIC_ASSETS.includes(url.href)) {
    event.respondWith(staleWhileRevalidateStrategy(request, STATIC_CACHE));
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// ========== ESTRATEGIAS DE CACHE ==========

/**
 * Cache First - Para imágenes y recursos estáticos
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Actualizar cache en background si es necesario
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('Cache First falló:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Network First - Para contenido dinámico
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('Network First falló, intentando cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

/**
 * Stale While Revalidate - Para CSS/JS
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch en background para actualizar cache
    const fetchPromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(error => {
      console.warn('Background fetch falló:', error);
    });
    
    // Devolver respuesta cacheada inmediatamente si existe
    if (cachedResponse) {
      fetchPromise; // No await - ejecutar en background
      return cachedResponse;
    }
    
    // Si no hay cache, esperar por la red
    return await fetchPromise;
    
  } catch (error) {
    console.warn('Stale While Revalidate falló:', error);
    return getOfflineFallback(request);
  }
}

/**
 * Actualizar cache en background
 */
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    // Silencioso - es solo una actualización en background
  }
}

/**
 * Fallback para cuando todo falla
 */
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    // Para páginas HTML, devolver página offline o index
    return caches.match('/') || caches.match('/index.html');
  }
  
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    // Para imágenes, devolver imagen placeholder
    return new Response(`
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">
          Imagen no disponible offline
        </text>
      </svg>
    `, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  // Para otros recursos, devolver respuesta básica
  return new Response('Recurso no disponible offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// ========== LIMPIEZA DE CACHE ==========
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(getCacheSize().then(size => {
      event.ports[0].postMessage({ cacheSize: size });
    }));
  }
});

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🗑️ Todos los caches limpiados');
  } catch (error) {
    console.error('❌ Error limpiando caches:', error);
  }
}

async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return formatBytes(totalSize);
  } catch (error) {
    console.error('❌ Error calculando tamaño de cache:', error);
    return 'Error';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========== NOTIFICACIONES PUSH ==========
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nuevo mensaje en tu portafolio',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    image: data.image,
    data: data.url ? { url: data.url } : undefined,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/assets/icons/action-open.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/assets/icons/action-close.png'
      }
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gino Portfolio', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Buscar si ya hay una ventana abierta
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// ========== SINCRONIZACIÓN EN BACKGROUND ==========
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm());
  }
  
  if (event.tag === 'cache-update') {
    event.waitUntil(updateStaticCache());
  }
});

async function syncContactForm() {
  try {
    // Recuperar formularios pendientes del IndexedDB
    const pendingForms = await getPendingForms();
    
    for (const form of pendingForms) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.data)
        });
        
        if (response.ok) {
          await removePendingForm(form.id);
          console.log('✅ Formulario sincronizado:', form.id);
        }
      } catch (error) {
        console.warn('⚠️ Error sincronizando formulario:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
  }
}

async function updateStaticCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Actualizar archivos críticos
    const criticalAssets = [
      '/',
      '/index.html',
      '/js/main.js',
      '/css/variables.css'
    ];
    
    for (const asset of criticalAssets) {
      try {
        const response = await fetch(asset, { cache: 'no-cache' });
        if (response.ok) {
          await cache.put(asset, response);
        }
      } catch (error) {
        console.warn(`⚠️ Error actualizando ${asset}:`, error);
      }
    }
    
    console.log('✅ Cache estático actualizado');
  } catch (error) {
    console.error('❌ Error actualizando cache:', error);
  }
}

// ========== UTILIDADES INDEXEDDB ==========
async function getPendingForms() {
  // Implementar lógica de IndexedDB para formularios pendientes
  return [];
}

async function removePendingForm(id) {
  // Implementar lógica de IndexedDB para remover formulario
}

// ========== MONITOREO DE PERFORMANCE ==========
self.addEventListener('fetch', (event) => {
  // Medir performance de requests importantes
  if (event.request.url.includes('/api/') || event.request.url.includes('.js')) {
    const startTime = performance.now();
    
    event.respondWith(
      fetch(event.request).then(response => {
        const duration = performance.now() - startTime;
        console.log(`⚡ ${event.request.url}: ${duration.toFixed(2)}ms`);
        return response;
      })
    );
  }
});

// ========== INFORMACIÓN DEL SERVICE WORKER ==========
console.log(`
🔧 Service Worker v${CACHE_NAME} iniciado
📦 Cachés: ${STATIC_CACHE}, ${DYNAMIC_CACHE}, ${IMAGE_CACHE}
🌐 Estrategias: Cache First, Network First, Stale While Revalidate
📱 PWA: Habilitado
🔄 Sync: Habilitado
🔔 Push: Habilitado
`);

// Enviar información del SW a la página
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SW_INFO') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      caches: [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE],
      features: {
        push: 'serviceWorker' in navigator && 'PushManager' in window,
        sync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        offline: true
      }
    });
  }
});