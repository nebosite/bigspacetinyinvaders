import http.server
import socketserver

print("Local python server for testing")

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # self.send_header("Content-type", "application/javascript")
        if self.path == '/':
            self.path = '/dist/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

MyHttpRequestHandler.extensions_map={
       '.manifest': 'text/cache-manifest',
	'.html': 'text/html',
    '.png': 'image/png',
	'.jpg': 'image/jpg',
	'.svg':	'image/svg+xml',
	'.css':	'text/css',
	'.js':	'text/javascript',
    '.module.js': 'module',
	'': 'application/octet-stream', # Default
    }

# Create an object of the above class
handler_object = MyHttpRequestHandler

PORT = 8000
my_server = socketserver.TCPServer(("", PORT), handler_object)

# Star the server
print("Starting the server on http://localhost:" + str(PORT))
my_server.serve_forever()
print("Serving!")