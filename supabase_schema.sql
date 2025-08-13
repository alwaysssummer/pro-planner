-- Students 테이블
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tasks 테이블
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  google_sheet_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Vocabulary Items 테이블
CREATE TABLE vocabulary_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  unit VARCHAR(255),
  english VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Student Assignments 테이블
CREATE TABLE student_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  task_title VARCHAR(255),
  target_unit VARCHAR(255),
  learning_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  evaluation_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(student_id, task_id)
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_vocabulary_task_id ON vocabulary_items(task_id);
CREATE INDEX idx_vocabulary_order ON vocabulary_items(order_index);
CREATE INDEX idx_assignments_student ON student_assignments(student_id);
CREATE INDEX idx_assignments_task ON student_assignments(task_id);