FROM nginx:1.27-alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY img /usr/share/nginx/html/img
COPY root-files /usr/share/nginx/html/root-files
COPY dreams /usr/share/nginx/html/dreams
COPY login /usr/share/nginx/html/login
COPY settings /usr/share/nginx/html/settings
