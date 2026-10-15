/* Survey content: Technology in Massachusetts Schools (families and educators).
   Each question: id, type, text (or text.parent / text.educator), options, and optional rules:
     req: required, only: 'parent' | 'educator' | 'teacherStaffAdmin', showIf: function(answers)
   Types: single, multi, dropdown, grid (rows x scale), text, longtext, zip, note.
   Column names in the Google Sheet come from the ids (grid rows become id__rowKey). */
window.TLO_SURVEY = (function () {
  var AGREE = ['Strongly agree', 'Somewhat agree', 'Neither agree nor disagree', 'Somewhat disagree', 'Strongly disagree', "Don't know"];
  var AGREE5 = AGREE.slice(0, 5);
  var GRADES = ['Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  var PARENT_REMINDER = 'Parents: please keep answering about the same child you chose at the start, the one with the next upcoming birthday.';
  return {
    id: 'ma-tech-schools-2026',
    title: 'Technology in Massachusetts Schools: What Families and Educators Think',
    endpoint: 'https://script.google.com/macros/s/AKfycbz8QY7PLMOQ1qm6JeQzLTCOACtsx0MCQj4v7pxuaKRmbX3cWCFwVc-5xT-MwwS8F083Rg/exec',      // Google Apps Script web app URL (see brief, step 2)
    emailFormUrl: '',  // separate Google Form for "send me the results"
    dashboardUrl: '',  // results page, once it exists
    districtsUrl: '../data/ma-districts.json',
    roleGroups: {
      parent: ['Parent or guardian of a child in kindergarten through 12th grade'],
      teacherStaffAdmin: ['Teacher', 'Other school staff (for example, counselor, nurse, paraprofessional, librarian, IT staff)', 'School or district administrator']
    },
    sections: [
      { id: 'welcome', title: 'Welcome', intro: [
          "Turning Life On is a Massachusetts nonprofit made up of parent-led groups in communities across the state. We want to hear from parents, caregivers, teachers, school staff and administrators about phones, educational technology and artificial intelligence (AI) in schools, including what's happening now and what you think the rules should be.",
          'Plan on about 10 to 12 minutes. You can skip any question, and you can leave the survey whenever you like.',
          "Your answers are anonymous. We won't ask for your name or address. If you'd like a copy of the results, you'll have the option to give your email on a separate page at the end, which is never linked to your answers. Once we've sent the results, we delete those emails.",
          "We'll share statewide results publicly. We'll only report results for a smaller group, like a single district or role, once at least 20 people in that group have answered, to keep everyone anonymous. We never sell or share your information."],
        questions: [
          { id: 'consent', type: 'single', req: true, text: 'Are you ready to begin?', options: ["Yes, I've read the information above and I'd like to take the survey", "No, I'd rather not take the survey"] }
        ] },
      { id: 'role', title: 'Your role', questions: [
          { id: 'role', type: 'single', req: true, other: 'Other (please describe)',
            text: 'Which best describes you?', help: "Please choose one role for this response. If you have more than one role (for example, you're a parent and a teacher), you're welcome to complete this survey again for each role.",
            options: ['Parent or guardian of a child in kindergarten through 12th grade', 'Teacher', 'Other school staff (for example, counselor, nurse, paraprofessional, librarian, IT staff)', 'School or district administrator', 'School committee member', 'Other (please describe)'] },
          { id: 'in_ma', type: 'single', req: true, text: { parent: "Is your child's school in Massachusetts?", educator: 'Is the school where you work in Massachusetts?' }, options: ['Yes', 'No'] }
        ] },
      { id: 'school', title: 'Your school', questions: [
          { id: 'district', type: 'dropdown', req: true, text: 'Which school district is the school in?', optionsFrom: 'districts',
            extra: ['Not part of a public school district (private, religious or independent school)', 'Homeschool', 'Not sure'] },
          { id: 'zip', type: 'zip', text: { parent: 'Optional. What is your five-digit home zip code?', educator: "Optional. What is the school's five-digit zip code?" } },
          { id: 'school_type', type: 'single', text: 'What kind of school is it?', options: ['District public school', 'Public charter school', 'Regional or vocational-technical school', 'Catholic or other religious school', 'Private or independent school (not religious)', 'Homeschool', 'Something else', 'Not sure'] },
          { id: 'grades', type: { parent: 'single', educator: 'multi' }, text: { parent: 'What grade is your child in?', educator: 'What grades do you work with? (select all that apply)' }, options: GRADES },
          { id: 'child_note', type: 'note', only: 'parent', text: 'If you have two or more children in kindergarten through 12th grade, please think about just one of them for the rest of the survey: the child with the next upcoming birthday.' }
        ] },
      { id: 'phones', title: 'Part 1: Phones and personal devices', reminder: PARENT_REMINDER, intro: [
          'By "personal devices," we mean phones, smartwatches, earbuds and other personally owned devices that connect to the internet. We don\'t mean laptops or tablets provided by the school. Some questions ask about what happens at school. Answer based on what you know, and choose "Don\'t know" if you\'re not sure.'],
        questions: [
          { id: 'q8_policy', type: 'single', text: "What is the school's current policy on personal devices during the school day?", options: ['Devices must be stored away for the entire school day', 'Devices may be used at lunch or between classes, but not during class', 'Devices can be used at any time, including during lunch and passing times', 'Each teacher decides for their own classroom', 'There is no policy', "Don't know"] },
          { id: 'q8a_storage', type: 'single', showIf: function (a) { return a.q8_policy === 'Devices must be stored away for the entire school day'; }, text: 'Where are devices stored during the school day?', options: ['Backpacks', 'Student lockers', 'Locked pouches', 'School-managed lockers or storage', 'Other', "Don't know"] },
          { id: 'q9_consistent', type: 'single', text: 'How consistently is the policy followed?', options: ['Very consistently', 'Somewhat consistently', 'Not very consistently', 'Not at all consistently', "Don't know"] },
          { id: 'q10_help_hurt', type: 'single', text: 'How much do personal devices help or hurt learning at the school?', options: ['Help a lot', 'Help a little', 'Neither help nor hurt', 'Hurt a little', 'Hurt a lot', "Don't know"] },
          { id: 'q11_phone_benefits', type: 'multi', exclusive: ["I don't see significant benefits"], text: 'What do you see as the biggest benefits of students having personal devices during the school day? (select all that apply)', options: ['Staying in touch with family', 'Safety during emergencies', 'Coordinating rides and after-school plans', 'Using phones for schoolwork (like a calculator or quick research)', 'Managing a medical need (like glucose monitoring)', 'Building independence and responsibility', "I don't see significant benefits", 'Other'] },
          { id: 'q12_phone_concerns', type: 'multi', exclusive: ["I don't have significant concerns"], text: 'What concerns, if any, do you have about students having personal devices during the school day? (select all that apply)', options: ['Distraction in class', 'Cyberbullying or social conflict', 'Photos or videos taken without consent', 'Less face-to-face time with friends', 'Social media use during the day', 'Effects on mental health or well-being', 'Cheating', 'Exposure to inappropriate content', 'Students texting parents throughout the day', "I don't have significant concerns", 'Other'] },
          { id: 'q13_phone_agree', type: 'grid', text: 'How much do you agree or disagree with each of the following?', scale: AGREE, rows: [
              ['keep_phones', 'Students should be able to keep their phones with them during the school day.'],
              ['bell_to_bell', 'Phones should be stored away from first bell to last bell, with exceptions for medical needs, IEPs and 504 plans.'],
              ['school_decides', 'Decisions about phones in school are best made by each school, not by the state.']] },
          { id: 'q14_state_law', type: 'single', text: 'Massachusetts lawmakers are considering a statewide law that would require schools to keep personal devices stored away for the entire school day. Would you support or oppose a law like this?', options: ['Strongly support', 'Somewhat support', 'Neither support nor oppose', 'Somewhat oppose', 'Strongly oppose', "Don't know"] },
          { id: 'q15_minutes_managing', type: 'single', only: 'teacherStaffAdmin', text: "In a typical class period, about how much time is spent managing students' personal devices?", options: ['None', 'Less than 5 minutes', '5 to 10 minutes', 'More than 10 minutes', 'Not applicable'] }
        ] },
      { id: 'edtech', title: 'Part 2: Educational technology', reminder: PARENT_REMINDER, intro: [
          'By "school devices," we mean the laptops, Chromebooks and tablets the school provides. By "digital products," we mean the apps, websites, programs and online platforms students use for schoolwork, including ones that use AI. Answer based on what you know, and choose "Don\'t know" if you\'re not sure.'],
        questions: [
          { id: 'q16_one_to_one', type: 'single', text: { parent: "Does your child have a one-to-one device, meaning a school laptop or tablet that's reserved just for them?", educator: 'Do students at your school have one-to-one devices, meaning a school laptop or tablet reserved for each student?' }, options: ['Yes', 'No, students share devices', 'Only in some grades or classes', "Don't know"] },
          { id: 'q17_device_time', type: 'single', text: { parent: 'How much time per school day does your child spend using a school device, including homework?', educator: 'How much time per school day does a typical student spend using a school device, including homework?' }, options: ['Less than 1 hour', '1 to 2 hours', '2 to 3 hours', '3 to 4 hours', 'More than 4 hours', "Don't know"] },
          { id: 'q18_homework', type: 'single', text: 'How often does homework require a device or the internet?', options: ['Never or rarely', 'Sometimes', 'Often', 'Always or almost always', "Don't know"] },
          { id: 'q19_go_home', type: 'single', text: 'Do school devices go home with students?', options: ['Yes, every day', 'Sometimes', 'No, they stay at school', "Don't know"] },
          { id: 'q20_tech_benefits', type: 'multi', exclusive: ["I don't see significant benefits"], text: 'What do you see as the biggest benefits of using school devices and digital products in school? (select all that apply)', options: ['Personalized learning', 'Access to educational resources', 'Organization and communication', 'Collaboration and creativity', 'Preparation for future school and work', 'Supports for students with different learning needs', 'Student engagement', "I don't see significant benefits", 'Other'] },
          { id: 'q21_tech_concerns', type: 'multi', exclusive: ["I don't have significant concerns"], text: 'What concerns, if any, do you have about the use of school devices and digital products in school? (select all that apply)', options: ['Amount of screen time', 'Distraction or reduced focus', 'Effects on social skills', 'Effects on mental health or well-being', 'Fewer opportunities for handwriting', 'Fewer opportunities to read printed books', 'Exposure to inappropriate content', 'Student data privacy', 'Game-like features (points, badges, leaderboards)', 'Inconsistent expectations across classrooms', 'Limited information about which digital products are used', "I don't have significant concerns", 'Other'] },
          { id: 'q22_tech_agree', type: 'grid', text: 'How much do you agree or disagree with each of the following?', scale: AGREE, rows: [
              ['improves_learning', 'Digital products improve learning outcomes for students at this school.'],
              ['communicates', 'The school clearly communicates what digital products students use.'],
              ['too_heavily', 'The school relies too heavily on digital products.'],
              ['not_enough', "The school doesn't use enough digital products."],
              ['screen_free_enough', 'Students have enough opportunities for screen-free learning, like hands-on activities and paper-based work.'],
              ['screen_time_concern', 'I am concerned about the amount of screen time students have during the school day.'],
              ['staff_decide', 'Teachers and school staff are in the best position to decide which digital products students use.']] },
          { id: 'q23_consent', type: 'single', text: 'Does the school ask families for consent before students use the internet and school devices?', options: ['Yes', 'No', "Don't know"] },
          { id: 'q24_grade_bands', type: 'grid', text: 'For each grade band, which approach to school devices do you think is best?', scale: ['No individual student devices', 'Shared devices that stay at school (cart or lab model)', 'An individual device that stays at school', 'An individual device that goes home', "Don't know"], rows: [['k2', 'K–2'], ['g3_5', '3–5'], ['g6_8', '6–8'], ['g9_12', '9–12']] },
          { id: 'q25_family_role', type: 'single', text: 'When the school decides which digital products students will use, what role should families play?', options: ['No role needed', "Families should hear about decisions after they're made", 'Families should be asked for their views before decisions are made', 'Families should help make the decisions', "Families' views should decide the outcome", 'Not sure'] },
          { id: 'q26_products_improve', type: 'single', only: 'teacherStaffAdmin', text: "Of the digital products you're expected to use, how many clearly improve student learning?", options: ['Most', 'Some', 'A few', 'None', "Don't know"] }
        ] },
      { id: 'ai', title: 'Part 3: Artificial intelligence (AI)', reminder: PARENT_REMINDER, intro: [
          'In this section, "AI" means computer programs that create new content or make suggestions on their own, such as writing text, making images, answering questions in conversation, or recommending what a student should do next. Examples include chatbots like ChatGPT, Gemini and Claude, and AI features built into other apps. It doesn\'t include everyday school systems that just store or display information, like online gradebooks, attendance tracking or a teacher\'s class webpage. Answer based on what you know, and choose "Don\'t know" if you\'re not sure.'],
        questions: [
          { id: 'q27_ai_attitudes', type: 'grid', text: 'How much do you agree or disagree with each of the following?', scale: AGREE5, rows: [
              ['life_better', 'AI will make my day-to-day life better.'],
              ['useful_work', 'AI is or will be useful in my job or the work I do.'],
              ['use_more', 'I expect to use AI tools more in the coming years than I do now.'],
              ['more_good', 'Overall, AI will do more good than harm for society.'],
              ['concerned', 'I am concerned about AI.']] },
          { id: 'q28_student_rules', type: 'single', text: 'Does the school have written rules about when students may and may not use AI for assignments?', options: ['Yes', 'No', "Don't know"] },
          { id: 'q29a_staff_policy', type: 'single', text: 'Does the school or district have a written policy about how staff and the school itself use AI?', options: ['Yes', 'No', "Don't know"] },
          { id: 'q29b_told_families', type: 'single', text: 'Has the school or district told families what its AI policies are?', options: ['Yes', 'No', "Don't know"] },
          { id: 'q30_students_using', type: 'single', text: 'Are students at the school using AI tools for schoolwork?', options: ['Yes, tools approved by the school', 'Yes, but not tools approved by the school', 'No', "Don't know"] },
          { id: 'q31_child_chatbot', type: 'single', only: 'parent', text: 'Has your child used an AI chatbot or AI companion app outside of school?', options: ['Yes, regularly', 'Yes, occasionally', 'No', "Don't know"] },
          { id: 'q32_ai_benefits', type: 'multi', exclusive: ["I don't see significant benefits"], text: 'What do you see as the biggest benefits of AI use in school? (select all that apply)', options: ["Personalized learning that adjusts to each student's pace and level", 'One-on-one tutoring support', 'Instant feedback on student work', 'Homework help outside school hours', 'Saving teachers time on planning, grading or paperwork', 'Supports for students with disabilities or students learning English', 'Student engagement and motivation', 'Help with creativity and brainstorming', 'Identifying students who need extra help', 'Preparing students for future school and work', "I don't see significant benefits", 'Other'] },
          { id: 'q33_ai_concerns', type: 'multi', exclusive: ["I don't have significant concerns"], text: 'What concerns, if any, do you have about AI use in school? (select all that apply)', options: ['Students relying on AI instead of doing their own thinking', 'Cheating or passing off AI work as their own', 'Students forming unhealthy emotional attachments to chatbots', 'AI giving wrong or made-up information', 'Exposure to inappropriate or harmful content', 'Student data privacy', 'Bias or unfair treatment of some students', 'Less time with teachers and classmates', 'Effects on mental health or well-being', 'AI tools not being tested before students use them', 'Limited information about which AI tools are used', "I don't have significant concerns", 'Other'] },
          { id: 'q34_ai_agree', type: 'grid', text: 'How much do you agree or disagree with each of the following?', scale: AGREE, rows: [
              ['notify_families', 'Families should be notified whenever teachers use AI tools with students.'],
              ['opt_out', 'Families should be able to choose that their child not use AI tools in class.'],
              ['pause_until_research', 'Schools should NOT use AI tools with students until independent research shows they are safe and effective.'],
              ['start_now', "Schools should start using AI tools with students now so they're prepared for the future."],
              ['publish_companies', 'Schools should make public which outside companies have access to student information.'],
              ['staff_decide_ai', 'Teachers and school staff are in the best position to decide how AI is used in class.']] },
          { id: 'q35_ai_grades', type: 'multi', exclusive: ['None of these grades', "Don't know"], text: 'In which grades, if any, is it appropriate for students to use AI tools at school? (select all that apply)', options: GRADES.concat(['None of these grades', "Don't know"]) },
          { id: 'q36_ai_training', type: 'single', only: 'teacherStaffAdmin', text: 'Have you received training on using AI tools?', options: ['Yes', 'No'] },
          { id: 'q36b_training_source', type: 'multi', only: 'teacherStaffAdmin', showIf: function (a) { return a.q36_ai_training === 'Yes'; }, text: 'Who provided it? (select all that apply)', options: ['My district', 'A technology company', 'A union or professional association', 'Other'] },
          { id: 'q37_ai_effect', type: 'single', only: 'teacherStaffAdmin', text: "How has AI affected students' learning, if at all?", options: ['Mostly positively', 'Both positively and negatively', 'Mostly negatively', 'No noticeable effect', "Don't know"] }
        ] },
      { id: 'thoughts', title: 'Your thoughts', questions: [
          { id: 'q38_one_change', type: 'longtext', text: "Optional. What's the most important change you'd like to see in how technology is used at the school?" },
          { id: 'q39_leaders', type: 'longtext', text: 'Optional. What else should school and state leaders hear from you on this topic?' },
          { id: 'q40_experiences', type: 'longtext', text: { parent: 'Optional. Please share any experiences, positive or negative, that your child has had with technology at school.', educator: 'Optional. Please share any experiences, positive or negative, that students you work with have had with technology at school.' }, help: "Please don't include names or details that could identify your child, other students or staff." }
        ] },
      { id: 'about', title: 'A little about you', intro: ['These questions help us see who took part. You can skip any of them.'], questions: [
          { id: 'q41_age', type: 'single', text: 'What is your age?', options: ['Under 25', '25 to 34', '35 to 44', '45 to 54', '55 or older', "I'd rather not say"] },
          { id: 'q42_language', type: 'single', text: 'Do people in your household often speak a language besides English at home?', options: ['Yes', 'No', "I'd rather not say"] },
          { id: 'q43_iep_504', type: 'single', only: 'parent', text: 'Does your child receive special education services or accommodations through an IEP or a 504 plan?', options: ['Yes', 'No', 'Not sure', "I'd rather not say"] },
          { id: 'q44_years', type: 'single', only: 'teacherStaffAdmin', text: 'How many years have you worked in schools?', options: ['Less than 5', '5 to 10', '11 to 20', 'More than 20'] }
        ] }
    ]
  };
})();
