import { supabase } from '../utils/supabase';

// Task 관련 함수들
export const taskService = {
  // 모든 과제 가져오기
  async getAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // 과제 생성
  async create(task: { title: string; description: string; area: string; status?: string }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, status: task.status || 'pending' }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 과제 수정
  async update(id: string, updates: Partial<{ title: string; description: string; area: string; status: string; google_sheet_url: string }>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 과제 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // 과제에 단어 데이터 추가
  async addVocabularyItems(taskId: string, items: Array<{ unit: string; english: string; meaning: string }>) {
    // 먼저 기존 단어들 삭제
    await supabase
      .from('vocabulary_items')
      .delete()
      .eq('task_id', taskId);

    // 새 단어들 추가
    if (items.length > 0) {
      // 배치 크기 설정 (Supabase 제한을 고려하여 500개씩)
      const BATCH_SIZE = 500;
      const totalBatches = Math.ceil(items.length / BATCH_SIZE);
      
      console.log(`총 ${items.length}개의 단어를 ${totalBatches}개의 배치로 나누어 저장합니다.`);
      
      // 배치로 나누어 처리
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, items.length);
        const batch = items.slice(start, end);
        
        const vocabularyData = batch.map((item, index) => ({
          task_id: taskId,
          unit: item.unit,
          english: item.english,
          meaning: item.meaning,
          order_index: start + index // 전체 순서 유지
        }));

        const { error } = await supabase
          .from('vocabulary_items')
          .insert(vocabularyData);
        
        if (error) {
          console.error(`배치 ${i + 1}/${totalBatches} 저장 실패:`, error);
          throw error;
        }
        
        console.log(`배치 ${i + 1}/${totalBatches} 저장 완료 (${start + 1}-${end}번째 단어)`);
      }
      
      console.log(`총 ${items.length}개의 단어 저장 완료`);
    }
  },

  // 과제의 단어 데이터 가져오기
  async getVocabularyItems(taskId: string) {
    const allItems = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    console.log(`과제 ${taskId}의 단어 데이터 로드 시작...`);
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('vocabulary_items')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error('단어 데이터 로드 오류:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        allItems.push(...data);
        console.log(`${from + 1} ~ ${from + data.length}번째 단어 로드 완료`);
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`과제 ${taskId}의 총 ${allItems.length}개 단어 로드 완료`);
    return allItems;
  }
};

// Student 관련 함수들
export const studentService = {
  // 모든 학생 가져오기
  async getAll() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // 학생 생성
  async create(student: { name: string; level: string }) {
    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 학생 수정
  async update(id: string, updates: Partial<{ name: string; level: string }>) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 학생 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // 학생 한 명 가져오기
  async getById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Task Assignment (과제 배정) 관련 함수들
export const assignmentService = {
  // 과제에 학생 배정
  async assignStudentToTask(taskId: string, studentId: string) {
    const { error } = await supabase
      .from('task_assignments')
      .insert([{ task_id: taskId, student_id: studentId }]);
    
    if (error && error.code !== '23505') throw error; // 중복 에러는 무시
  },

  // 과제에서 학생 배정 해제
  async unassignStudentFromTask(taskId: string, studentId: string) {
    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId)
      .eq('student_id', studentId);
    
    if (error) throw error;
  },

  // 과제에 배정된 학생들 가져오기
  async getStudentsByTask(taskId: string) {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('student_id, students(*)')
      .eq('task_id', taskId);
    
    if (error) throw error;
    return data?.map(item => item.students) || [];
  },

  // 학생에게 배정된 과제들 가져오기
  async getTasksByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('task_id, tasks(*)')
      .eq('student_id', studentId);
    
    if (error) throw error;
    return data?.map(item => item.tasks) || [];
  }
}; 