export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SmartDairy AI REST API',
    version: '1.0.0',
    description:
      'Intelligent Milking Monitoring & Early Mastitis Risk Detection (SIH Prototype). Complete API for cows, RFID, sessions, inline sensors, AI risk engine, CIP, and alerts.'
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Authenticate demo user & retrieve JWT token',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@smartdairy.local' },
                  password: { type: 'string', example: 'Admin@123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Successful login with JWT token and user info' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user identity',
        tags: ['Authentication'],
        responses: { 200: { description: 'Current authenticated user profile' } }
      }
    },
    '/api/cows': {
      get: {
        summary: 'List registered cows with baselines and health status',
        tags: ['Cows'],
        parameters: [
          { name: 'riskLevel', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'List of cows' } }
      },
      post: {
        summary: 'Register a new cow',
        tags: ['Cows'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cowCode', 'rfidId', 'name'],
                properties: {
                  cowCode: { type: 'string', example: 'COW-031' },
                  rfidId: { type: 'string', example: 'RFID-982731' },
                  name: { type: 'string', example: 'Pushpa' },
                  breed: { type: 'string', example: 'Gir' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Cow created' } }
      }
    },
    '/api/cows/{id}': {
      get: {
        summary: 'Get cow profile, historical sessions, and personal baselines',
        tags: ['Cows'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detailed cow record' } }
      }
    },
    '/api/rfid/scan': {
      post: {
        summary: 'Simulate or ingest an RFID transceiver scan',
        tags: ['RFID'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tagUid', 'readerId'],
                properties: {
                  tagUid: { type: 'string', example: 'RFID-982701' },
                  readerId: { type: 'string', example: 'RFID-RDR-01' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'RFID detection and cow identification result' } }
      }
    },
    '/api/sessions/live': {
      get: {
        summary: 'Get current real-time milking station telemetry and status',
        tags: ['Milking Sessions'],
        responses: { 200: { description: 'Live session status' } }
      }
    },
    '/api/simulation/start': {
      post: {
        summary: 'Start real-time milking line simulation for a cow',
        tags: ['Simulation'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cowCode: { type: 'string', example: 'COW-001' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Live milking simulation initiated' } }
      }
    },
    '/api/simulation/stop': {
      post: {
        summary: 'Stop live milking, calculate volume, and execute AI risk engine',
        tags: ['Simulation'],
        responses: { 200: { description: 'Session finalized and AI prediction returned' } }
      }
    },
    '/api/simulation/scenario': {
      post: {
        summary: 'Run one of 9 predefined SIH demo scenarios',
        tags: ['Simulation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['scenario'],
                properties: {
                  scenario: {
                    type: 'string',
                    enum: [
                      'NORMAL_COW',
                      'EARLY_WARNING',
                      'HIGH_RISK',
                      'RFID_MISSED',
                      'UNKNOWN_RFID',
                      'SENSOR_FAILURE',
                      'NETWORK_FAILURE',
                      'CIP_CYCLE',
                      'MULTIPLE_COWS'
                    ]
                  }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Scenario triggered' } }
      }
    },
    '/api/health/cows': {
      get: {
        summary: 'Udder Health Risk Monitoring table with deviations and alerts',
        tags: ['Health Analytics'],
        responses: { 200: { description: 'Health monitoring list' } }
      }
    },
    '/api/alerts': {
      get: {
        summary: 'Get farm alerts filtered by severity and status',
        tags: ['Alerts'],
        responses: { 200: { description: 'List of alerts' } }
      }
    },
    '/api/cip/status': {
      get: {
        summary: 'Get Clean-In-Place (CIP) status and verified isolated readings',
        tags: ['Clean-In-Place (CIP)'],
        responses: { 200: { description: 'CIP cycle status' } }
      }
    }
  }
};

