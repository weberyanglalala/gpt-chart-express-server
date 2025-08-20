FROM node:20-alpine

WORKDIR /app

# Install build dependencies for canvas and font support
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    # 添加字体支持
    fontconfig-dev \
    ttf-dejavu \
    ttf-liberation \
    # 如果需要中文支持，添加以下字体
    font-noto-cjk \
    font-wqy-zenhei

# 更新字体缓存
RUN fc-cache -fv

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
