import { db } from './db';
import { student, teacher } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testCaseConversion() {
  console.log('Testing case conversion...');

  // Test student insertion with camelCase
  const studentData = {
    fullName: 'Test Student',
    gender: 'male' as const,
    dateOfBirth: '2000-01-01', // Date as string in ISO format
    placeOfBirth: 'Test City',
    groupId: 1,
    medicalGroup: 'basic' as const
  };

  console.log('Inserting student with camelCase:', studentData);
  const [insertedStudent] = await db.insert(student)
    .values(studentData)
    .returning();
  
  console.log('Inserted student (should have camelCase):', insertedStudent);

  // Test teacher insertion with camelCase
  const teacherData = {
    fullName: 'Test Teacher',
    position: 'Professor',
    dateOfBirth: '1980-01-01', // Date as string in ISO format
    educationalDepartment: 'Test Department'
  };

  console.log('Inserting teacher with camelCase:', teacherData);
  const [insertedTeacher] = await db.insert(teacher)
    .values(teacherData)
    .returning();
  
  console.log('Inserted teacher (should have camelCase):', insertedTeacher);

  // Test direct query to see database column names
  const result = await db.query.student.findFirst({
    where: eq(student.studentId, insertedStudent.studentId)
  });
  
  console.log('Query result (should have camelCase):', result);

  // Clean up test data
  await db.delete(student).where(eq(student.studentId, insertedStudent.studentId));
  await db.delete(teacher).where(eq(teacher.teacherId, insertedTeacher.teacherId));
}

testCaseConversion().catch(console.error); 