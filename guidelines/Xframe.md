# Iframe Embedding Guide

This application is fully configured to be embedded within an iframe in your internal applications.

## Backend Configuration

The .NET Core backend has been configured to allow iframe embedding:

### Headers Configuration (Program.cs)

```csharp
// Allow iframe embedding - do not send X-Frame-Options header
app.Use(async (context, next) =>
{
    // Remove X-Frame-Options if it exists (allows iframe embedding)
    context.Response.Headers.Remove("X-Frame-Options");
    
    // Allow embedding from any origin
    // Note: In production, you may want to restrict this to specific origins
    // context.Response.Headers.Add("Content-Security-Policy", "frame-ancestors 'self' https://your-parent-app.com");
    
    await next();
});
```

### CORS Configuration

CORS is configured to allow all origins:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

## Frontend Configuration

The React frontend does not send any headers that would block iframe embedding.

### No CSP Restrictions

The application does not include Content Security Policy headers that would prevent iframe embedding.

### No X-Frame-Options

The application does not set X-Frame-Options headers that would block iframe usage.

## Embedding the Application

### Basic Iframe Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>Internal Dashboard</title>
    <style>
        #client-management-iframe {
            width: 100%;
            height: 100vh;
            border: none;
        }
    </style>
</head>
<body>
    <iframe 
        id="client-management-iframe"
        src="https://your-client-management-app.com"
        title="Client Management"
        allow="clipboard-read; clipboard-write"
    ></iframe>

    <script>
        // Listen for messages from the iframe
        window.addEventListener('message', function(event) {
            // Verify origin in production
            // if (event.origin !== 'https://your-client-management-app.com') return;

            console.log('Message from iframe:', event.data);

            // Handle ready event
            if (event.data.type === 'CLIENT_MANAGEMENT_READY') {
                console.log('Client Management app is ready');
            }

            // Handle resize events for responsive iframe
            if (event.data.type === 'RESIZE') {
                const iframe = document.getElementById('client-management-iframe');
                iframe.style.height = event.data.height + 'px';
            }
        });

        // Send messages to the iframe
        function sendMessageToIframe(message) {
            const iframe = document.getElementById('client-management-iframe');
            iframe.contentWindow.postMessage(message, '*');
        }
    </script>
</body>
</html>
```

### Advanced: Responsive Iframe with PostMessage Communication

```html
<!DOCTYPE html>
<html>
<head>
    <title>Internal Dashboard with Client Management</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .dashboard-container {
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 250px;
            background: #1e293b;
            color: white;
            padding: 20px;
        }
        .main-content {
            flex: 1;
            overflow: hidden;
        }
        #client-management-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="sidebar">
            <h2>Internal Dashboard</h2>
            <nav>
                <button onclick="navigateIframe('/clients')">Clients</button>
                <button onclick="navigateIframe('/clients/1')">Client Details</button>
            </nav>
        </div>
        <div class="main-content">
            <iframe 
                id="client-management-iframe"
                src="https://your-client-management-app.com"
                title="Client Management"
                allow="clipboard-read; clipboard-write"
            ></iframe>
        </div>
    </div>

    <script>
        const iframe = document.getElementById('client-management-iframe');
        const targetOrigin = 'https://your-client-management-app.com'; // Change in production

        // Listen for messages from the iframe
        window.addEventListener('message', function(event) {
            // Verify origin in production
            // if (event.origin !== targetOrigin) return;

            console.log('Message from Client Management:', event.data);

            switch(event.data.type) {
                case 'CLIENT_MANAGEMENT_READY':
                    console.log('Client Management app loaded successfully');
                    // You can send initialization data here
                    sendToIframe({
                        type: 'INIT',
                        user: getCurrentUser(),
                        config: getAppConfig()
                    });
                    break;

                case 'RESIZE':
                    // Handle responsive iframe sizing
                    iframe.style.height = event.data.height + 'px';
                    break;

                case 'NAVIGATE':
                    // Handle navigation events from iframe
                    console.log('Iframe navigated to:', event.data.path);
                    break;

                case 'CLIENT_SELECTED':
                    // Handle client selection
                    console.log('Client selected:', event.data.clientId);
                    updateParentDashboard(event.data.clientId);
                    break;
            }
        });

        // Send messages to the iframe
        function sendToIframe(message) {
            iframe.contentWindow.postMessage(message, targetOrigin);
        }

        // Navigate the iframe
        function navigateIframe(path) {
            sendToIframe({
                type: 'NAVIGATE',
                path: path
            });
        }

        // Example helper functions
        function getCurrentUser() {
            return { username: 'admin', role: 'admin' };
        }

        function getAppConfig() {
            return { theme: 'light', locale: 'en' };
        }

        function updateParentDashboard(clientId) {
            // Update parent dashboard based on client selection
            console.log('Updating parent dashboard for client:', clientId);
        }
    </script>
</body>
</html>
```

## Using the useIframeEmbedding Hook

The application includes a React hook for iframe communication:

```typescript
import { useIframeEmbedding } from './hooks/useIframeEmbedding';

function MyComponent() {
  const { isEmbedded, sendToParent, notifyHeightChange } = useIframeEmbedding();

  const handleClientSelect = (clientId: number) => {
    // Notify parent window about client selection
    if (isEmbedded) {
      sendToParent({
        type: 'CLIENT_SELECTED',
        clientId,
      });
    }
  };

  useEffect(() => {
    // Notify parent of height changes
    notifyHeightChange();
  }, [/* dependencies */]);

  return (
    <div>
      {isEmbedded && <div>Running in embedded mode</div>}
      {/* Your component content */}
    </div>
  );
}
```

## Security Considerations

### Production Recommendations

1. **Restrict Frame Ancestors**: In production, update the CSP header to allow only your internal domain:

```csharp
context.Response.Headers.Add("Content-Security-Policy", 
    "frame-ancestors 'self' https://your-internal-app.com");
```

2. **Verify Message Origins**: Always verify the origin of postMessage events:

```javascript
window.addEventListener('message', function(event) {
    // Only accept messages from trusted origin
    if (event.origin !== 'https://your-internal-app.com') {
        return;
    }
    // Process message
});
```

3. **CORS Configuration**: In production, restrict CORS to specific origins:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowInternal", policy =>
    {
        policy.WithOrigins("https://your-internal-app.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

## Authentication in Iframe Context

The application supports authentication within an iframe:

- JWT tokens are stored in localStorage
- Session state is maintained within the iframe
- Cross-origin authentication is supported via CORS

### Passing Authentication from Parent

If you want to authenticate from the parent application:

```javascript
// In parent window
sendToIframe({
    type: 'AUTH',
    token: 'your-jwt-token'
});
```

```typescript
// In iframe (React component)
useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'AUTH') {
            localStorage.setItem('auth_token', event.data.token);
            // Reload or refresh authentication state
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
}, []);
```

## Testing Iframe Embedding Locally

To test iframe embedding during development:

1. Create a simple HTML file (e.g., `test-iframe.html`):

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Iframe Embedding</title>
    <style>
        body { margin: 0; }
        iframe { width: 100%; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe src="http://localhost:3000" title="Client Management"></iframe>
</body>
</html>
```

2. Serve the HTML file using a simple HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Open `http://localhost:8000/test-iframe.html` in your browser

## Common Issues and Solutions

### Issue: Iframe shows "X-Frame-Options" error

**Solution**: Ensure the backend middleware is properly configured to remove X-Frame-Options headers.

### Issue: CORS errors when calling API from iframe

**Solution**: Verify CORS configuration in `Program.cs` allows the parent domain.

### Issue: Authentication not persisting in iframe

**Solution**: Check that cookies are set with `SameSite=None; Secure` for cross-origin contexts, or use token-based authentication stored in localStorage.

### Issue: Iframe not responsive on mobile

**Solution**: Ensure the iframe has responsive CSS and consider using the resize notification feature.

## Browser Support

Iframe embedding is supported in all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Additional Features

### Sandbox Attribute

For additional security, you can add sandbox attributes to the iframe:

```html
<iframe 
    src="https://your-app.com"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
></iframe>
```

### Loading Placeholder

Show a loading state while the iframe loads:

```html
<div id="iframe-container">
    <div id="loading">Loading Client Management...</div>
    <iframe 
        id="client-management-iframe"
        src="https://your-app.com"
        onload="document.getElementById('loading').style.display='none'"
    ></iframe>
</div>
```

## Support

For issues related to iframe embedding, please contact your development team or refer to the main application documentation.
