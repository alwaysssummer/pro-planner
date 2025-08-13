import { loadStudents, loadTasks } from './storage';
import { studentService, taskService, assignmentService } from '../services/database';

export const migrateDataToSupabase = async () => {
  try {
    console.log('🚀 Supabase 마이그레이션 시작...');
    
    // 1. 로컬 스토리지에서 데이터 로드
    const localStudents = loadStudents();
    const localTasks = loadTasks();
    
    console.log(`📊 로컬 데이터: ${localStudents.length}명의 학생, ${localTasks.length}개의 과제`);
    
    // 2. 과제 마이그레이션
    console.log('📝 과제 마이그레이션 중...');
    for (const task of localTasks) {
      try {
        // 과제 생성
        const createdTask = await taskService.create({
          id: task.id,
          title: task.title,
          description: task.description || '',
          area: task.area,
          status: task.status || 'pending',
          google_sheet_url: task.googleSheetUrl
        });
        
        // 단어 데이터가 있으면 추가
        if (task.vocabularyData && task.vocabularyData.length > 0) {
          await taskService.addVocabularyItems(task.id, task.vocabularyData);
        }
        
        console.log(`✅ 과제 "${task.title}" 마이그레이션 완료`);
      } catch (error) {
        console.error(`❌ 과제 "${task.title}" 마이그레이션 실패:`, error);
      }
    }
    
    // 3. 학생 마이그레이션
    console.log('👥 학생 마이그레이션 중...');
    for (const student of localStudents) {
      try {
        // 학생 생성
        const createdStudent = await studentService.create({
          id: student.id,
          name: student.name,
          grade: student.grade
        });
        
        // 과제 배정 정보 마이그레이션
        if (student.taskAssignments && student.taskAssignments.length > 0) {
          for (const assignment of student.taskAssignments) {
            try {
              await assignmentService.create({
                student_id: student.id,
                task_id: assignment.taskId,
                task_title: assignment.taskTitle,
                target_unit: assignment.targetUnit || assignment.startUnit,
                learning_count: assignment.learningCount || 0,
                wrong_count: assignment.wrongCount || 0,
                evaluation_count: assignment.evaluationCount || 0,
                status: assignment.status || 'pending'
              });
            } catch (error) {
              console.error(`❌ 과제 배정 마이그레이션 실패:`, error);
            }
          }
        }
        
        console.log(`✅ 학생 "${student.name}" 마이그레이션 완료`);
      } catch (error) {
        console.error(`❌ 학생 "${student.name}" 마이그레이션 실패:`, error);
      }
    }
    
    console.log('🎉 마이그레이션 완료!');
    return { success: true };
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    return { success: false, error };
  }
};

// 브라우저 콘솔에서 실행할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).migrateDataToSupabase = migrateDataToSupabase;
}