import { PrismaClient, TaskStatus, TaskOrigin, ChangeActor, VerificationStatus, DependencyType, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MEDUSA Database Seeding...');

  // 1. Categories
  const categoriesData = [
    { name: 'AI & ML', slug: 'AI_ML', icon: 'brain', color_token: 'purple', priority: 1 },
    { name: 'Backend', slug: 'BACKEND', icon: 'server', color_token: 'emerald', priority: 2 },
    { name: 'DevOps', slug: 'DEVOPS', icon: 'terminal', color_token: 'blue', priority: 3 },
    { name: 'System Design', slug: 'SYSTEM_DESIGN', icon: 'network', color_token: 'indigo', priority: 4 },
    { name: 'C++', slug: 'CPP', icon: 'code', color_token: 'cyan', priority: 5 },
    { name: 'Open Source', slug: 'OPEN_SOURCE', icon: 'git-pull-request', color_token: 'teal', priority: 6 },
    { name: 'GitHub', slug: 'GITHUB', icon: 'github', color_token: 'slate', priority: 7 },
    { name: 'Academics', slug: 'ACADEMICS', icon: 'book', color_token: 'amber', priority: 8 },
    { name: 'Gym', slug: 'GYM', icon: 'dumbbell', color_token: 'red', priority: 9 },
    { name: 'Mind', slug: 'MIND', icon: 'lotus', color_token: 'sky', priority: 10 },
    { name: 'Reading', slug: 'READING', icon: 'book-open', color_token: 'yellow', priority: 11 },
    { name: 'Freelancing', slug: 'FREELANCING', icon: 'briefcase', color_token: 'orange', priority: 12 },
    { name: 'Project', slug: 'PROJECT', icon: 'folder', color_token: 'violet', priority: 13 },
    { name: 'Other', slug: 'OTHER', icon: 'more-horizontal', color_token: 'gray', priority: 14 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { user_id_slug: { user_id: null, slug: cat.slug } },
      create: { user_id: null, name: cat.name, slug: cat.slug, icon: cat.icon, color_token: cat.color_token, priority: cat.priority },
      update: {},
    });
  }
  console.log('✅ Default categories seeded.');

  // 2. Test User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'operator@medusa.app' },
    create: {
      name: 'Medusa Operator',
      email: 'operator@medusa.app',
      password_hash: hashedPassword,
      timezone: 'UTC',
      commitment_phrase: 'I ACCEPT THE COST',
      github_username: 'medusa-operator',
    },
    update: {},
  });
  console.log(`✅ Test User created: ${user.email} (id: ${user.id})`);

  // 3. Test Arc
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  const arc = await prisma.arc.create({
    data: {
      user_id: user.id,
      name: 'Backend Mastery 30-Day Arc',
      description: 'Master advanced distributed systems, Redis caching, and kernel tuning.',
      start_date: startDate,
      end_date: endDate,
      timezone: 'UTC',
      daily_capacity_minutes: 360,
      weekly_capacity_minutes: 2160,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Test Arc created: ${arc.name} (id: ${arc.id})`);

  // User stats
  await prisma.userStats.upsert({
    where: { arc_id: arc.id },
    create: {
      user_id: user.id,
      arc_id: arc.id,
      current_score: 120,
      current_streak: 5,
      longest_streak: 5,
      total_completed: 8,
      total_skipped: 1,
      total_abandoned: 0,
      total_deep_work_minutes: 360,
    },
    update: {},
  });

  const backendCategory = await prisma.category.findFirst({ where: { slug: 'BACKEND' } });
  const aiCategory = await prisma.category.findFirst({ where: { slug: 'AI_ML' } });

  // 4. Sample Tasks
  const todayStr = startDate.toISOString().split('T')[0];

  // Completed task
  const completedTask = await prisma.task.create({
    data: {
      user_id: user.id,
      arc_id: arc.id,
      title: 'Implement Redis Distributed Lock',
      description: 'Build redlock algorithm and benchmark under contention.',
      category_id: backendCategory.id,
      estimated_minutes: 90,
      actual_minutes: 85,
      difficulty: 3,
      priority: 'HIGH',
      scheduled_date: todayStr,
      status: TaskStatus.COMPLETED,
      origin: TaskOrigin.USER,
      verification_type: 'MANUAL',
      verification_status: VerificationStatus.VERIFIED,
    },
  });

  await prisma.taskRevision.create({
    data: {
      task_id: completedTask.id,
      version: 1,
      title: completedTask.title,
      description: completedTask.description,
      category_id: completedTask.category_id,
      estimated_minutes: completedTask.estimated_minutes,
      difficulty: completedTask.difficulty,
      priority: completedTask.priority,
      changed_by: ChangeActor.USER,
      change_summary: 'Initial creation',
    },
  });

  // Skipped task
  const skippedTask = await prisma.task.create({
    data: {
      user_id: user.id,
      arc_id: arc.id,
      title: 'Read Database Internals Chapter 4',
      description: 'B-Trees and LSM Trees comparison.',
      category_id: backendCategory.id,
      estimated_minutes: 60,
      difficulty: 2,
      priority: 'MEDIUM',
      scheduled_date: todayStr,
      status: TaskStatus.SKIPPED,
      origin: TaskOrigin.USER,
    },
  });

  // Pending AI Task
  const aiTask = await prisma.task.create({
    data: {
      user_id: user.id,
      arc_id: arc.id,
      title: 'Study Transformer Attention Mechanics',
      description: 'Understand multi-head self-attention and KV cache memory.',
      category_id: aiCategory.id,
      estimated_minutes: 120,
      difficulty: 4,
      priority: 'CRITICAL',
      scheduled_date: todayStr,
      status: TaskStatus.PENDING,
      origin: TaskOrigin.AI,
      user_modified: false,
    },
  });

  await prisma.taskRevision.create({
    data: {
      task_id: aiTask.id,
      version: 1,
      title: aiTask.title,
      description: aiTask.description,
      category_id: aiTask.category_id,
      estimated_minutes: aiTask.estimated_minutes,
      difficulty: aiTask.difficulty,
      priority: aiTask.priority,
      changed_by: ChangeActor.AI,
      change_summary: 'AI Curriculum Extraction',
    },
  });

  console.log('✅ Sample Tasks created.');

  // 5. Sample Focus Session
  await prisma.focusSession.create({
    data: {
      user_id: user.id,
      task_id: completedTask.id,
      status: 'COMPLETED',
      started_at: new Date(Date.now() - 90 * 60 * 1000),
      ended_at: new Date(),
      duration_seconds: 5400,
    },
  });
  console.log('✅ Sample Focus Session created.');

  // 6. Sample ArcDay
  await prisma.arcDay.upsert({
    where: { arc_id_date: { arc_id: arc.id, date: todayStr } },
    create: {
      arc_id: arc.id,
      date: todayStr,
      planned_minutes: 270,
      completed_minutes: 85,
      deep_work_minutes: 90,
      planned_tasks: 3,
      completed_tasks: 1,
      skipped_tasks: 1,
      missed_tasks: 0,
      score_delta: 25,
      status: 'OPEN',
    },
    update: {},
  });
  console.log('✅ Sample ArcDay created.');

  // 7. Sample Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'alphateam' },
    create: {
      name: 'Alpha Execution Squad',
      slug: 'alphateam',
      invite_code: 'MEDUSA-ALPHA100',
      owner_id: user.id,
      members: {
        create: {
          user_id: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
    update: {},
  });
  console.log(`✅ Sample Workspace created: ${workspace.name} (invite code: ${workspace.invite_code})`);

  console.log('🎉 MEDUSA Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
