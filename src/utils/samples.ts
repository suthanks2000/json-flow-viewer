export interface SampleItem {
  id: string;
  name: string;
  description: string;
  badge: string;
  data: any;
}

export const SAMPLE_DATASETS: SampleItem[] = [
  {
    id: 'nested-user',
    name: 'Nested User Profile',
    description: 'User entity with nested address, array of skills, and profile data',
    badge: 'Popular',
    data: {
      user: {
        id: "usr_9981a",
        profile: {
          firstName: "Sophia",
          lastName: "Chen",
          title: "Principal Systems Architect",
          age: 29,
          active: true
        },
        contact: {
          email: "sophia.chen@example.com",
          phone: "+1 (555) 382-9901",
          secondaryEmail: null
        },
        skills: [
          "React",
          "TypeScript",
          "Distributed Systems",
          "GraphQL"
        ],
        address: {
          city: "San Francisco",
          state: "California",
          country: "United States",
          postalCode: "94107"
        }
      }
    }
  },
  {
    id: 'api-response',
    name: 'E-Commerce Order API',
    description: 'Realistic REST API response with pagination, line items, and nested objects',
    badge: 'Real-world API',
    data: {
      status: 200,
      success: true,
      message: "Order details fetched successfully",
      data: {
        orderId: "ord_2026_8831",
        placedAt: "2026-10-06T04:45:00Z",
        currency: "USD",
        totals: {
          subtotal: 349.95,
          tax: 27.99,
          shipping: 0.00,
          grandTotal: 377.94
        },
        customer: {
          id: "cust_4402",
          name: "Alexander Wright",
          membershipTier: "Gold"
        },
        items: [
          {
            sku: "TECH-KB-PRO",
            name: "Tactile Mechanical Keyboard",
            quantity: 1,
            unitPrice: 199.99,
            inStock: true
          },
          {
            sku: "ACC-DESK-PAD",
            name: "Merino Wool Desk Mat",
            quantity: 2,
            unitPrice: 74.98,
            inStock: true
          }
        ],
        shippingAddress: {
          street: "742 Evergreen Terrace",
          city: "Springfield",
          country: "USA"
        }
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 2
      }
    }
  },
  {
    id: 'simple-user',
    name: 'Simple User',
    description: 'A clean introductory JSON object with primitive fields',
    badge: 'Basic',
    data: {
      name: "John Doe",
      age: 28,
      email: "john@example.com",
      role: "Software Engineer",
      verified: true,
      referrer: null
    }
  },
  {
    id: 'cloud-cluster',
    name: 'Cloud Microservices',
    description: 'Cluster topology with service replicas, regions, and telemetry flags',
    badge: 'Microservices',
    data: {
      cluster: "us-west-prod-01",
      health: "HEALTHY",
      replicaCount: 3,
      autoscaling: true,
      services: [
        {
          name: "auth-gateway",
          version: "2.4.0",
          port: 8080,
          tags: ["security", "public"]
        },
        {
          name: "payment-engine",
          version: "1.18.2",
          port: 9000,
          tags: ["financial", "pci-compliant"]
        },
        {
          name: "notification-broker",
          version: "3.0.1",
          port: 5050,
          tags: ["async", "internal"]
        }
      ],
      quotas: {
        maxMemoryGb: 64,
        maxCpuCores: 32,
        usedMemoryPercentage: 42.5
      }
    }
  },
  {
    id: 'deep-hierarchy',
    name: 'Deep Nested Hierarchy',
    description: 'Multi-level nested nodes to test deep branch navigation and zoom',
    badge: 'Deep Nesting',
    data: {
      rootLevel: {
        level1: {
          department: "Engineering",
          level2: {
            team: "Frontend Platform",
            level3: {
              squad: "Visualization Core",
              level4: {
                project: "JSON Flow Viewer",
                level5: {
                  module: "Canvas Renderer",
                  active: true,
                  version: 1
                }
              }
            }
          }
        }
      }
    }
  }
];
