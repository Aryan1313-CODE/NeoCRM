import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const permissions = [
  ["dashboard", "read"],
  ["customers", "read"],
  ["customers", "write"],
  ["leads", "read"],
  ["deals", "read"],
  ["products", "read"],
  ["quotes", "read"],
  ["orders", "read"],
  ["compliance", "read"],
  ["analytics", "read"],
  ["tasks", "read"],
  ["users", "read"],
  ["users", "write"],
  ["organization", "read"],
  ["organization", "write"],
  ["audit", "read"]
];

const rolePermissions: Record<string, string[]> = {
  admin: permissions.map(([r, a]) => `${r}:${a}`),
  sales_manager: [
    "dashboard:read","customers:read","customers:write","leads:read","deals:read",
    "products:read","quotes:read","orders:read","compliance:read","analytics:read","tasks:read"
  ],
  sales: [
    "dashboard:read","customers:read","customers:write","leads:read","deals:read",
    "products:read","quotes:read","tasks:read"
  ],
  inventory: ["dashboard:read","products:read","orders:read","compliance:read"],
  auditor: ["dashboard:read","audit:read","analytics:read"]
};

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Chemora Chemicals",
      industry: "Chemical Manufacturing & Distribution",
      location: "Bengaluru, India",
      currency: "INR"
    }
  });

  const permissionRows: Record<string, string> = {};
  for (const [resource, action] of permissions) {
    const p = await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action }
    });
    permissionRows[`${resource}:${action}`] = p.id;
  }

  const roleRows: Record<string, string> = {};
  for (const roleName of Object.keys(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` }
    });
    roleRows[roleName] = role.id;

    for (const key of rolePermissions[roleName]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionRows[key]
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionRows[key]
        }
      });
    }
  }

  const passwordHash = await argon2.hash("Admin@123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@chemora.com" },
    update: {},
    create: {
      name: "Riddima Singh",
      email: "admin@chemora.com",
      passwordHash,
      organizationId: org.id,
      status: "ACTIVE"
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleRows.admin } },
    update: {},
    create: { userId: admin.id, roleId: roleRows.admin }
  });

  const demoUsers = [
    ["Amit Verma", "amit@chemora.com", "sales"],
    ["Neha Kapoor", "neha@chemora.com", "inventory"],
    ["Audit User", "audit@chemora.com", "auditor"]
  ];

  for (const [name, email, roleName] of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash,
        organizationId: org.id,
        status: "ACTIVE"
      }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRows[roleName] } },
      update: {},
      create: { userId: user.id, roleId: roleRows[roleName] }
    });
  }

  const customerCount = await prisma.customer.count({ where: { organizationId: org.id } });
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        { organizationId: org.id, name: "Riddima Singh", company: "Reliance Industries", type: "Customer", industry: "Chemicals", location: "Mumbai" },
        { organizationId: org.id, name: "Aarti Shah", company: "Aarti Chemicals", type: "Customer", industry: "Specialty Chemicals", location: "Mumbai" },
        { organizationId: org.id, name: "Rahul Mehta", company: "Galaxy Surfactants", type: "Supplier", industry: "Surfactants", location: "Mumbai" },
        { organizationId: org.id, name: "Neha Kapoor", company: "Galaxy Surfactants", type: "Customer", industry: "Surfactants", location: "Mumbai", status: "Inactive" }
      ]
    });
  }

  const leadCount = await prisma.lead.count({ where: { organizationId: org.id } });
  if (leadCount === 0) {
    await prisma.lead.createMany({ data: [
      { organizationId: org.id, company: "Reliance Industries", contactName: "Amit Verma", status: "QUALIFIED", value: 42000000 },
      { organizationId: org.id, company: "Aarti Chemicals", contactName: "Priya Shah", status: "NEGOTIATION", value: 28000000 },
      { organizationId: org.id, company: "Acme Petrochem", contactName: "Karan Mehta", status: "NEGOTIATION", value: 19000000 },
      { organizationId: org.id, company: "UPL Ltd.", contactName: "Sneha Iyer", status: "WON", value: 16000000 },
      { organizationId: org.id, company: "Tata Chemicals", contactName: "Vikram Rao", status: "NEW", value: 12000000 },
      { organizationId: org.id, company: "SRF Ltd.", contactName: "Neha Kapoor", status: "LOST", value: 7000000 }
    ]});
  }

  const quoteCount = await prisma.quote.count({ where: { organizationId: org.id } });
  if (quoteCount === 0) {
    await prisma.quote.createMany({ data: [
      { organizationId: org.id, customerName: "Aarti Chemicals", status: "SENT", amount: 8500000 },
      { organizationId: org.id, customerName: "Reliance Industries", status: "SENT", amount: 12000000 },
      { organizationId: org.id, customerName: "Tata Chemicals", status: "ACCEPTED", amount: 6400000 },
      { organizationId: org.id, customerName: "UPL Ltd.", status: "SENT", amount: 5100000 }
    ]});
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@chemora.com / Admin@123");
}

main().finally(() => prisma.$disconnect());
