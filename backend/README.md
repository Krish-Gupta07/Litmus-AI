# Litmus AI Backend

A Node.js/Express.js backend with BullMQ-powered job queuing for AI-powered fact-checking and misinformation detection.

## 🚀 Features

- **BullMQ Job Queue**: Asynchronous processing of analysis jobs
- **AI Integration**: Google Gemini 2.5 Flash for query transformation and fact-checking
- **Web Scraping**: URL content extraction with Playwright and Cheerio
- **Database Integration**: PostgreSQL with Prisma ORM
- **Authentication**: User verification and rate limiting
- **Validation**: Zod schema validation for all requests
- **Graceful Shutdown**: Proper cleanup of resources

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts          # Configuration management
│   │   └── source-weights.ts # Source weighting config
│   ├── lib/
│   │   ├── constants.ts      # Application constants
│   │   ├── prisma.ts         # Prisma client
│   │   ├── redis.ts          # Redis connection
│   │   └── utils.ts          # Utility functions
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   └── validate.ts       # Request validation
│   ├── routes/
│   │   ├── analysis.routes.ts # Analysis endpoints
│   │   └── routes.ts         # Legacy routes
│   ├── services/
│   │   ├── queue.ts          # BullMQ queue service
│   │   ├── query-transform.ts # AI query transformation
│   │   ├── final-answer.ts   # AI final answer generation
│   │   ├── scraper.ts        # Web scraping service
│   │   └── exa.ts           # Search integration
│   ├── types/
│   │   └── queue.ts          # TypeScript type definitions
│   ├── workers/
│   │   └── analysis.worker.ts # Job processing worker
│   └── index.ts              # Main application entry
├── prisma/
│   └── schema.prisma         # Database schema
├── package.json
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL
- Redis
- Google AI API key
- Exa API key (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```env
   # Server
   PORT=4000
   NODE_ENV=development
   
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/litmus_ai"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # External APIs
   EXA_API_KEY="your-exa-api-key"
   
   # Note: GOOGLE_API_KEY is automatically read by AI SDK
   # Note: DATABASE_URL is automatically read by Prisma
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database (optional)
   npx prisma db seed
   ```

4. **Start Services**
   ```bash
   # Start Redis (if not running)
   redis-server
   
   # Start PostgreSQL (if not running)
   # Use your preferred method
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Queue Worker (Separate Process)
```bash
npm run queue:worker
```

## 📊 API Endpoints

### Analysis Endpoints

#### Submit Analysis Job
```http
POST /api/analysis/analyze
Content-Type: application/json
X-User-ID: 1

{
  "url": "https://example.com/article",
  "text": "Optional text content",
  "userId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "123",
    "dbJobId": 456,
    "status": "pending",
    "message": "Analysis job queued successfully",
    "estimatedTime": "30-60 seconds"
  }
}
```

#### Get Job Status
```http
GET /api/analysis/status/123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "123",
    "queueStatus": {
      "state": "completed",
      "progress": 100,
      "result": { ... }
    },
    "dbJob": {
      "id": 456,
      "status": "COMPLETED",
      "result": { ... }
    },
    "progress": 100,
    "currentStep": "Completed"
  }
}
```

#### Get User Jobs
```http
GET /api/analysis/jobs/1
```

#### Queue Statistics (Admin)
```http
GET /api/queue/stats
X-User-ID: 1
```

### Legacy Endpoints (Synchronous)

#### Query Transformation
```http
POST /api/query-transform
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Your query here" }
  ]
}
```

#### Final Answer
```http
POST /api/final-answer
Content-Type: application/json

{
  "transformedQuery": { ... },
  "contextData": [ ... ]
}
```

## 🔄 Queue System

### Job Flow
1. **Job Creation**: User submits analysis request
2. **Queue Addition**: Job added to BullMQ queue
3. **Processing**: Worker picks up job and processes:
   - Web scraping (if URL provided)
   - AI query transformation
   - AI final answer generation
   - Database result storage
4. **Completion**: Job marked as completed with results

### Queue Management
- **Concurrency**: Configurable worker concurrency
- **Retry Logic**: Exponential backoff for failed jobs
- **Progress Tracking**: Real-time job progress updates
- **Cleanup**: Automatic cleanup of old jobs

### Monitoring
```bash
# Get queue statistics
curl -H "X-User-ID: 1" http://localhost:4000/api/queue/stats

# Clean old jobs
curl -X POST -H "X-User-ID: 1" http://localhost:4000/api/queue/clean
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 4000 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `REDIS_URL` | Redis connection string for BullMQ | redis://localhost:6379 | Yes |
| `EXA_API_KEY` | Exa search API key | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes (auto-read by Prisma) |
| `GOOGLE_API_KEY` | Google AI API key | - | Yes (auto-read by AI SDK) |

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test analysis submission
curl -X POST http://localhost:4000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{"text": "Test claim to fact-check", "userId": 1}'
```

## 🚨 Error Handling

The application includes comprehensive error handling:
- **Validation Errors**: Zod schema validation
- **Authentication Errors**: User verification
- **Rate Limiting**: Request throttling
- **Queue Errors**: Job processing failures
- **Database Errors**: Connection and query issues

## 📈 Monitoring & Logging

- **Console Logging**: Structured logging with emojis
- **Job Progress**: Real-time progress tracking
- **Queue Statistics**: Job counts and performance metrics
- **Error Tracking**: Detailed error logging

## 🔒 Security

- **Input Validation**: All inputs validated with Zod
- **Rate Limiting**: Per-user request throttling
- **Authentication**: User verification middleware
- **CORS**: Configurable cross-origin requests

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

### Environment Setup
- Set up PostgreSQL database
- Configure Redis instance
- Set all required environment variables
- Run database migrations

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include validation for new endpoints
4. Add error handling
5. Update documentation

## 📝 License

ISC License
