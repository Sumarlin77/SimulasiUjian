import { PrismaClient, QuestionType, Difficulty, UserRole, TestStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
});

async function main() {
  console.log('Starting seeding process...');

  // Clear database (optional - comment out if you don't want to clear DB on each seed)
  console.log('Clearing existing data...');
  await prisma.answer.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.test.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const adminPassword = await hash('Admin123!', 12);
  const participantPassword = await hash('Peserta123!', 12);

  const admin1 = await prisma.user.create({
    data: {
      name: 'Admin Utama',
      email: 'admin@ujiansimulator.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Admin Kedua',
      email: 'admin2@ujiansimulator.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const participant1 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      password: participantPassword,
      role: UserRole.PARTICIPANT,
      universityName: 'Universitas Indonesia',
      major: 'Teknik Informatika',
    },
  });

  const participant2 = await prisma.user.create({
    data: {
      name: 'Siti Rahayu',
      email: 'siti@example.com',
      password: participantPassword,
      role: UserRole.PARTICIPANT,
      universityName: 'Universitas Gadjah Mada',
      major: 'Teknik Elektro',
    },
  });

  const participant3 = await prisma.user.create({
    data: {
      name: 'Ahmad Rizki',
      email: 'ahmad@example.com',
      password: participantPassword,
      role: UserRole.PARTICIPANT,
      universityName: 'Institut Teknologi Bandung',
      major: 'Ilmu Komputer',
    },
  });

  // Create question sets
  console.log('Creating question sets...');
  const mathQuestionSet = await prisma.questionSet.create({
    data: {
      title: 'Matematika Dasar',
      description: 'Kumpulan soal matematika dasar untuk tingkat SMA',
      subject: 'Matematika',
      createdById: admin1.id,
    },
  });

  const programmingQuestionSet = await prisma.questionSet.create({
    data: {
      title: 'Algoritma dan Pemrograman',
      description: 'Kumpulan soal tentang algoritma dan pemrograman dasar',
      subject: 'Informatika',
      createdById: admin1.id,
    },
  });

  const englishQuestionSet = await prisma.questionSet.create({
    data: {
      title: 'Bahasa Inggris',
      description: 'Kumpulan soal bahasa Inggris untuk persiapan TOEFL',
      subject: 'Bahasa Inggris',
      createdById: admin2.id,
    },
  });

  // Create questions for Math question set
  console.log('Creating math questions...');
  const mathQuestions = [
    {
      text: 'Berapakah hasil dari 5 × 3?',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Matematika',
      difficulty: Difficulty.EASY,
      options: JSON.stringify([
        { id: 'a', text: '8' },
        { id: 'b', text: '15' },
        { id: 'c', text: '18' },
        { id: 'd', text: '25' },
      ]),
      correctAnswer: 'b',
      explanation: 'Hasil dari 5 × 3 = 15',
      points: 1,
      questionSetId: mathQuestionSet.id,
    },
    {
      text: 'Berapakah hasil dari 8 + 4?',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Matematika',
      difficulty: Difficulty.EASY,
      options: JSON.stringify([
        { id: 'a', text: '10' },
        { id: 'b', text: '12' },
        { id: 'c', text: '14' },
        { id: 'd', text: '16' },
      ]),
      correctAnswer: 'b',
      explanation: 'Hasil dari 8 + 4 = 12',
      points: 1,
      questionSetId: mathQuestionSet.id,
    },
    {
      text: 'Tentukan akar-akar persamaan kuadrat x² - 5x + 6 = 0',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Matematika',
      difficulty: Difficulty.MEDIUM,
      options: JSON.stringify([
        { id: 'a', text: 'x = 2 dan x = 3' },
        { id: 'b', text: 'x = -2 dan x = -3' },
        { id: 'c', text: 'x = 1 dan x = 6' },
        { id: 'd', text: 'x = -1 dan x = -6' },
      ]),
      correctAnswer: 'a',
      explanation: 'Untuk persamaan x² - 5x + 6 = 0, diskriminan = b² - 4ac = 25 - 24 = 1. Akar-akarnya x = (5 ± √1)/2 = (5 ± 1)/2, yaitu x = 3 dan x = 2',
      points: 2,
      questionSetId: mathQuestionSet.id,
    },
    {
      text: 'Jelaskan langkah-langkah untuk menyelesaikan sistem persamaan linear dengan metode eliminasi.',
      type: QuestionType.ESSAY,
      subject: 'Matematika',
      difficulty: Difficulty.MEDIUM,
      explanation: 'Langkah-langkah metode eliminasi: 1) Samakan koefisien salah satu variabel yang akan dieliminasi, 2) Kurangkan atau jumlahkan kedua persamaan, 3) Selesaikan untuk variabel tersisa, 4) Substitusi nilai variabel yang ditemukan ke salah satu persamaan awal untuk menemukan nilai variabel lainnya.',
      points: 3,
      questionSetId: mathQuestionSet.id,
    },
    {
      text: 'Hitunglah limit berikut: lim(x→2) (x² - 4) / (x - 2)',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Matematika',
      difficulty: Difficulty.HARD,
      options: JSON.stringify([
        { id: 'a', text: '0' },
        { id: 'b', text: '2' },
        { id: 'c', text: '4' },
        { id: 'd', text: 'Tidak terdefinisi' },
      ]),
      correctAnswer: 'c',
      explanation: 'Kita memfaktorkan pembilang: (x² - 4) / (x - 2) = ((x - 2)(x + 2)) / (x - 2) = x + 2. Saat x → 2, hasilnya adalah 2 + 2 = 4',
      points: 3,
      questionSetId: mathQuestionSet.id,
    },
  ];

  for (const question of mathQuestions) {
    await prisma.question.create({
      data: {
        ...question,
        options: question.options ? JSON.parse(question.options) : undefined,
      },
    });
  }

  // Create questions for Programming question set
  console.log('Creating programming questions...');
  const programmingQuestions = [
    {
      text: 'Apa output dari kode berikut?\n\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Informatika',
      difficulty: Difficulty.EASY,
      options: JSON.stringify([
        { id: 'a', text: '0 1 2 3 4' },
        { id: 'b', text: '1 2 3 4 5' },
        { id: 'c', text: '0 1 2 3 4 5' },
        { id: 'd', text: '1 2 3 4' },
      ]),
      correctAnswer: 'a',
      explanation: 'Loop for dimulai dari i = 0 dan berjalan selama i < 5, sehingga akan mencetak angka 0 sampai 4.',
      points: 1,
      questionSetId: programmingQuestionSet.id,
    },
    {
      text: 'Tentukan kompleksitas waktu (Big O) dari algoritma binary search.',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Informatika',
      difficulty: Difficulty.MEDIUM,
      options: JSON.stringify([
        { id: 'a', text: 'O(1)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n)' },
        { id: 'd', text: 'O(n²)' },
      ]),
      correctAnswer: 'b',
      explanation: 'Binary search memiliki kompleksitas waktu O(log n) karena setiap iterasi setengah dari array dieliminasi dari pencarian.',
      points: 2,
      questionSetId: programmingQuestionSet.id,
    },
    {
      text: 'Buatlah fungsi rekursif untuk menghitung faktorial dari sebuah bilangan.',
      type: QuestionType.ESSAY,
      subject: 'Informatika',
      difficulty: Difficulty.MEDIUM,
      explanation: 'Fungsi faktorial rekursif dapat diimplementasikan sebagai:\n\nfunction factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}',
      points: 3,
      questionSetId: programmingQuestionSet.id,
    },
    {
      text: 'Jelaskan perbedaan antara array dan linked list.',
      type: QuestionType.ESSAY,
      subject: 'Informatika',
      difficulty: Difficulty.MEDIUM,
      explanation: 'Array adalah struktur data dengan elemen berurutan dalam memori yang memungkinkan akses acak dengan kompleksitas O(1). Linked list adalah struktur data dengan node yang terhubung melalui pointer, memungkinkan penyisipan/penghapusan efisien di awal/akhir dengan kompleksitas O(1), tetapi akses acak memerlukan waktu O(n).',
      points: 3,
      questionSetId: programmingQuestionSet.id,
    },
    {
      text: 'Apa yang akan terjadi jika kita menjalankan kode berikut?\n\nconst obj1 = { a: 1 };\nconst obj2 = { a: 1 };\nconsole.log(obj1 === obj2);',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Informatika',
      difficulty: Difficulty.EASY,
      options: JSON.stringify([
        { id: 'a', text: 'true' },
        { id: 'b', text: 'false' },
        { id: 'c', text: 'undefined' },
        { id: 'd', text: 'Error' },
      ]),
      correctAnswer: 'b',
      explanation: 'Operator === membandingkan referensi objek, bukan isinya. Karena obj1 dan obj2 adalah dua objek berbeda di memori, hasilnya adalah false meskipun mereka memiliki properti yang sama.',
      points: 1,
      questionSetId: programmingQuestionSet.id,
    },
  ];

  for (const question of programmingQuestions) {
    await prisma.question.create({
      data: {
        ...question,
        options: question.options ? JSON.parse(question.options) : undefined,
      },
    });
  }

  // Create questions for English question set
  console.log('Creating English questions...');
  const englishQuestions = [
    {
      text: 'Choose the correct form of the verb: She ___ to the market yesterday.',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Bahasa Inggris',
      difficulty: Difficulty.EASY,
      options: JSON.stringify([
        { id: 'a', text: 'go' },
        { id: 'b', text: 'goes' },
        { id: 'c', text: 'went' },
        { id: 'd', text: 'has gone' },
      ]),
      correctAnswer: 'c',
      explanation: 'We need to use the past tense form for an action that happened yesterday, which is "went".',
      points: 1,
      questionSetId: englishQuestionSet.id,
    },
    {
      text: 'What is the passive form of: "They are building a new bridge"?',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Bahasa Inggris',
      difficulty: Difficulty.MEDIUM,
      options: JSON.stringify([
        { id: 'a', text: 'A new bridge is being built.' },
        { id: 'b', text: 'A new bridge was built.' },
        { id: 'c', text: 'A new bridge has been built.' },
        { id: 'd', text: 'A new bridge will be built.' },
      ]),
      correctAnswer: 'a',
      explanation: 'The present continuous active ("are building") becomes present continuous passive ("is being built").',
      points: 2,
      questionSetId: englishQuestionSet.id,
    },
    {
      text: 'Write a short paragraph (5-7 sentences) about your favorite book or movie.',
      type: QuestionType.ESSAY,
      subject: 'Bahasa Inggris',
      difficulty: Difficulty.MEDIUM,
      explanation: 'A good response should include a clear topic sentence, supporting details about the book/movie, and proper grammar and vocabulary. The paragraph should be well-organized and coherent.',
      points: 4,
      questionSetId: englishQuestionSet.id,
    },
    {
      text: 'Choose the word with the correct spelling:',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Bahasa Inggris',
      difficulty: Difficulty.EASY,
      options: JSON.stringify([
        { id: 'a', text: 'Accomodate' },
        { id: 'b', text: 'Accommodate' },
        { id: 'c', text: 'Acommodate' },
        { id: 'd', text: 'Acomodate' },
      ]),
      correctAnswer: 'b',
      explanation: 'The correct spelling is "accommodate" with double "c" and double "m".',
      points: 1,
      questionSetId: englishQuestionSet.id,
    },
    {
      text: 'What is the correct meaning of the idiom "to beat around the bush"?',
      type: QuestionType.MULTIPLE_CHOICE,
      subject: 'Bahasa Inggris',
      difficulty: Difficulty.MEDIUM,
      options: JSON.stringify([
        { id: 'a', text: 'To win a difficult competition' },
        { id: 'b', text: 'To avoid talking about the main point' },
        { id: 'c', text: 'To search for something in a difficult place' },
        { id: 'd', text: 'To physically attack a plant' },
      ]),
      correctAnswer: 'b',
      explanation: 'The idiom "to beat around the bush" means to avoid discussing the main topic or to talk about something without getting to the point.',
      points: 2,
      questionSetId: englishQuestionSet.id,
    },
  ];

  for (const question of englishQuestions) {
    await prisma.question.create({
      data: {
        ...question,
        options: question.options ? JSON.parse(question.options) : undefined,
      },
    });
  }

  // Create tests
  console.log('Creating tests...');
  const now = new Date();

  // Active Math test (currently ongoing)
  const mathTest = await prisma.test.create({
    data: {
      title: 'Ujian Matematika Dasar',
      description: 'Ujian matematika dasar untuk tingkat SMA',
      subject: 'Matematika',
      duration: 60, // minutes
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day from now
      isActive: true,
      passingScore: 70,
      createdById: admin1.id,
      questionSetId: mathQuestionSet.id,
    },
  });

  // Upcoming Programming test
  const programmingTest = await prisma.test.create({
    data: {
      title: 'Ujian Algoritma dan Pemrograman',
      description: 'Ujian tentang algoritma dan pemrograman dasar',
      subject: 'Informatika',
      duration: 90, // minutes
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      isActive: true,
      passingScore: 60,
      createdById: admin1.id,
      questionSetId: programmingQuestionSet.id,
    },
  });

  // Past English test
  const englishTest = await prisma.test.create({
    data: {
      title: 'Ujian Persiapan TOEFL',
      description: 'Ujian persiapan TOEFL untuk melatih kemampuan bahasa Inggris',
      subject: 'Bahasa Inggris',
      duration: 120, // minutes
      startTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endTime: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      isActive: false,
      passingScore: 75,
      createdById: admin2.id,
      questionSetId: englishQuestionSet.id,
    },
  });

  // Create test attempts and answers
  console.log('Creating test attempts and answers...');

  // Get all questions from math question set
  const mathQuestionsFromDb = await prisma.question.findMany({
    where: { questionSetId: mathQuestionSet.id },
  });

  // Add completed test attempt for participant 1 (passed)
  const participant1MathAttempt = await prisma.testAttempt.create({
    data: {
      userId: participant1.id,
      testId: mathTest.id,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      score: 80,
      status: TestStatus.PASSED,
    },
  });

  // Add answers for participant 1's math test
  for (const question of mathQuestionsFromDb) {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Correctly answer most multiple choice questions to get 80% score
      const isCorrect = Math.random() < 0.8;

      await prisma.answer.create({
        data: {
          testAttemptId: participant1MathAttempt.id,
          questionId: question.id,
          answer: isCorrect ? question.correctAnswer || 'a' : 'a', // If isCorrect is true, use correct answer, otherwise just use 'a'
          isCorrect: isCorrect,
          score: isCorrect ? question.points : 0,
        },
      });
    } else if (question.type === QuestionType.ESSAY) {
      // Simulating a good essay answer
      await prisma.answer.create({
        data: {
          testAttemptId: participant1MathAttempt.id,
          questionId: question.id,
          answer: 'Metode eliminasi untuk sistem persamaan linear meliputi langkah-langkah sebagai berikut: 1) Menyamakan koefisien variabel yang akan dieliminasi, biasanya dengan mengalikan persamaan dengan konstanta tertentu, 2) Mengurangkan persamaan untuk menghilangkan variabel tersebut, 3) Menyelesaikan persamaan yang tersisa untuk mendapatkan nilai variabel pertama, 4) Mensubstitusi nilai ke salah satu persamaan awal untuk mendapatkan nilai variabel yang lain.',
          isCorrect: true,
          score: Math.floor(question.points * 0.8), // 80% of possible points
        },
      });
    }
  }

  // Get all questions from English question set
  const englishQuestionsFromDb = await prisma.question.findMany({
    where: { questionSetId: englishQuestionSet.id },
  });

  // Add completed test attempt for participant 2 (failed)
  const participant2EnglishAttempt = await prisma.testAttempt.create({
    data: {
      userId: participant2.id,
      testId: englishTest.id,
      startTime: new Date(now.getTime() - 9.5 * 24 * 60 * 60 * 1000), // 9.5 days ago
      endTime: new Date(now.getTime() - 9.3 * 24 * 60 * 60 * 1000), // 9.3 days ago
      score: 60,
      status: TestStatus.FAILED,
    },
  });

  // Add answers for participant 2's English test
  for (const question of englishQuestionsFromDb) {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Correctly answer about 60% of multiple choice questions
      const isCorrect = Math.random() < 0.6;

      await prisma.answer.create({
        data: {
          testAttemptId: participant2EnglishAttempt.id,
          questionId: question.id,
          answer: isCorrect ? question.correctAnswer || 'a' : 'c', // If isCorrect is true, use correct answer, otherwise use 'c'
          isCorrect: isCorrect,
          score: isCorrect ? question.points : 0,
        },
      });
    } else if (question.type === QuestionType.ESSAY) {
      // Simulating a mediocre essay answer
      await prisma.answer.create({
        data: {
          testAttemptId: participant2EnglishAttempt.id,
          questionId: question.id,
          answer: 'My favorite movie is Avengers Endgame. It has a lot of action. The actors are very good. The movie is very exciting. I watched it three times.',
          isCorrect: null, // Essay answers don't have isCorrect flag set automatically
          score: Math.floor(question.points * 0.6), // 60% of possible points
        },
      });
    }
  }

  // Get all questions from English question set
  const programmingQuestionsFromDb = await prisma.question.findMany({
    where: { questionSetId: programmingQuestionSet.id },
  });

  // Add completed test attempt for participant 3 (passed)
  const participant3ProgrammingAttempt = await prisma.testAttempt.create({
    data: {
      userId: participant3.id,
      testId: programmingTest.id,
      startTime: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago (simulating a previous run of the same test)
      endTime: new Date(now.getTime() - 19.8 * 24 * 60 * 60 * 1000), // 19.8 days ago
      score: 90,
      status: TestStatus.PASSED,
    },
  });

  // Add answers for participant 3's programming test
  for (const question of programmingQuestionsFromDb) {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Correctly answer almost all multiple choice questions
      const isCorrect = Math.random() < 0.9;

      await prisma.answer.create({
        data: {
          testAttemptId: participant3ProgrammingAttempt.id,
          questionId: question.id,
          answer: isCorrect ? question.correctAnswer || 'b' : 'd', // If isCorrect is true, use correct answer, otherwise use 'd'
          isCorrect: isCorrect,
          score: isCorrect ? question.points : 0,
        },
      });
    } else if (question.type === QuestionType.ESSAY) {
      // Simulating an excellent essay answer
      await prisma.answer.create({
        data: {
          testAttemptId: participant3ProgrammingAttempt.id,
          questionId: question.id,
          answer: question.text.includes('faktorial')
            ? 'function factorial(n) {\n  // Base case\n  if (n === 0 || n === 1) {\n    return 1;\n  }\n  // Recursive case\n  return n * factorial(n - 1);\n}\n\n// Contoh penggunaan\nconsole.log(factorial(5)); // Output: 120'
            : 'Array dan linked list adalah dua struktur data yang memiliki karakteristik berbeda:\n\n1. Lokasi memori: Array menyimpan elemen-elemen secara berurutan dalam memori, sementara linked list menyimpan elemen-elemen dalam node terpisah yang terhubung melalui pointer.\n\n2. Akses elemen: Array memungkinkan akses acak langsung ke elemen manapun dengan kompleksitas O(1), sedangkan linked list memerlukan traversal dari awal hingga posisi yang diinginkan dengan kompleksitas O(n).\n\n3. Ukuran: Array biasanya memiliki ukuran tetap (dalam beberapa bahasa pemrograman), sementara linked list dapat tumbuh atau menyusut secara dinamis.\n\n4. Operasi penyisipan/penghapusan: Dalam array, penyisipan/penghapusan di tengah memerlukan pergeseran elemen dengan kompleksitas O(n), sedangkan dalam linked list hanya perlu mengubah pointer dengan kompleksitas O(1) jika kita sudah memiliki pointer ke node tempat operasi dilakukan.',
          isCorrect: null,
          score: question.points, // Full points
        },
      });
    }
  }

  // Add in-progress test attempt for participant 3 on math test
  await prisma.testAttempt.create({
    data: {
      userId: participant3.id,
      testId: mathTest.id,
      startTime: new Date(now.getTime() - (15 * 60 * 1000)), // Started 15 minutes ago
      status: TestStatus.IN_PROGRESS,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
