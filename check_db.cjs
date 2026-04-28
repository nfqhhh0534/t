const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://plttgmfcypsjpawqeqrw.supabase.co',
  'sb_publishable_7cm4uKOL-HJPzpR-VHr5jg_HCAVmW6p',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function checkData() {
  console.log('=== 检查数据库数据 ===\n');
  
  // 1. 检查 questions
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, title')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('1. Questions (最近5条):');
  if (qError) {
    console.log('   Error:', qError);
  } else {
    console.log('   Found:', questions?.length || 0, 'questions');
    if (questions) {
      questions.forEach(q => console.log('   -', q.id.substring(0, 8) + '...', q.title.substring(0, 30)));
    }
  }
  
  // 2. 检查 answers
  const { data: answers, error: aError } = await supabase
    .from('answers')
    .select('id, question_id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('\n2. Answers (最近10条):');
  if (aError) {
    console.log('   Error:', aError);
  } else {
    console.log('   Found:', answers?.length || 0, 'answers');
    if (answers) {
      answers.forEach(a => console.log('   -', a.id.substring(0, 8) + '...', 'Q:', a.question_id.substring(0, 8) + '...', a.content.substring(0, 40)));
    }
  }
  
  // 3. 检查某个问题的 answers
  if (questions && questions.length > 0) {
    const firstQ = questions[0];
    console.log('\n3. 查找问题', firstQ.id.substring(0, 8), '的 answers:');
    
    const { data: qAnswers, error: qaError } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', firstQ.id);
    
    if (qaError) {
      console.log('   Error:', qaError);
    } else {
      console.log('   Found:', qAnswers?.length || 0, 'answers for this question');
    }
  }
}

checkData().catch(console.error);
