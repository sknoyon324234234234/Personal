#!/usr/bin/env python3
"""Local preview with the same clean URLs as the live site.

  /hire        serves hire.html
  /hire.html   redirects to /hire (query string kept)
  unknown      serves 404.html with a 404 status

Usage:  python tools/serve.py [port]      (default 8080, run from anywhere)
"""
import http.server
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def route(self):
        url = urllib.parse.urlsplit(self.path)
        path, query = url.path, ('?' + url.query if url.query else '')
        if path.endswith('.html') and path != '/404.html':
            clean = path[:-len('.html')]
            if clean.endswith('/index'):
                clean = clean[:-len('index')]
            self.send_response(301)
            self.send_header('Location', clean + query)
            self.end_headers()
            return False
        local = os.path.join(ROOT, urllib.parse.unquote(path).strip('/'))
        if path.endswith('/') and path != '/' and os.path.isfile(local + '.html'):
            # a page and a folder share a name (demos.html and demos/): the page wins
            self.send_response(301)
            self.send_header('Location', path.rstrip('/') + query)
            self.end_headers()
            return False
        if not os.path.splitext(path)[1] and os.path.isfile(local + '.html'):
            self.path = path + '.html' + query
        return True

    def do_GET(self):
        if self.route():
            super().do_GET()

    def do_HEAD(self):
        if self.route():
            super().do_HEAD()

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, '404.html')
        if code != 404 or not os.path.isfile(page):
            return super().send_error(code, message, explain)
        body = open(page, 'rb').read()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print('Serving %s at http://localhost:%d' % (ROOT, port))
    http.server.ThreadingHTTPServer(('', port), Handler).serve_forever()
