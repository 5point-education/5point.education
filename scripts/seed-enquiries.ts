import { PrismaClient, ServiceType, EnquiryStatus } from "@prisma/client";
import { config } from "dotenv";

// Load environment variables
config();

const prisma = new PrismaClient();

// Sample data for enquiries
const enquiriesData = [
  {
    name: "Rahul Sharma",
    phone: "9876543210",
    email: "rahul@gmail.com",
    class_level: 10,
    subjects: "Mathematics, Physics",
    service_type: ServiceType.TUITION_BATCH,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Priya Patel",
    phone: "9876543211",
    email: "priya@gmail.com",
    class_level: 9,
    subjects: "Chemistry, Biology",
    service_type: ServiceType.HOME_TUTOR,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Amit Kumar",
    phone: "9876543212",
    email: "amit@gmail.com",
    class_level: 11,
    subjects: "Physics, Mathematics, Chemistry",
    service_type: ServiceType.TUITION_BATCH,
    status: EnquiryStatus.FEES_DISCUSSED,
  },
  {
    name: "Sneha Das",
    phone: "9876543213",
    email: "sneha@gmail.com",
    class_level: 8,
    subjects: "English, Mathematics",
    service_type: ServiceType.TUITION_BATCH,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Vikram Singh",
    phone: "9876543214",
    email: "vikram@gmail.com",
    class_level: 12,
    subjects: "Physics, Chemistry",
    service_type: ServiceType.HOME_TUTOR,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Ananya Roy",
    phone: "9876543215",
    email: "ananya@gmail.com",
    class_level: 10,
    subjects: "Biology, Chemistry",
    service_type: ServiceType.TUITION_BATCH,
    status: EnquiryStatus.FEES_DISCUSSED,
  },
  {
    name: "Rohan Verma",
    phone: "9876543216",
    email: "rohan@gmail.com",
    class_level: 9,
    subjects: "Mathematics, Science",
    service_type: ServiceType.TUITION_BATCH,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Meera Joshi",
    phone: "9876543217",
    email: "meera@gmail.com",
    class_level: 11,
    subjects: "English, History",
    service_type: ServiceType.HOME_TUTOR,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Arjun Malhotra",
    phone: "9876543218",
    email: "arjun@gmail.com",
    class_level: 10,
    subjects: "Mathematics, Physics, Chemistry",
    service_type: ServiceType.TUITION_BATCH,
    status: EnquiryStatus.PENDING,
  },
  {
    name: "Kavya Nair",
    phone: "9876543219",
    email: "kavya@gmail.com",
    class_level: 12,
    subjects: "Biology, Physics",
    service_type: ServiceType.HOME_TUTOR,
    status: EnquiryStatus.FEES_DISCUSSED,
  },
];

async function main() {
  console.log("Starting to seed enquiries...");

  for (const enquiryData of enquiriesData) {
    try {
      const enquiry = await prisma.enquiry.create({
        data: enquiryData,
      });
      console.log(`✓ Created enquiry for ${enquiry.name} - ${enquiry.subjects}`);
    } catch (error) {
      console.error(`✗ Failed to create enquiry for ${enquiryData.name}:`, error);
    }
  }

  console.log("\nEnquiry seeding completed!");
  console.log(`Total enquiries created: ${enquiriesData.length}`);
}

main()
  .catch((e) => {
    console.error("Error seeding enquiries:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
