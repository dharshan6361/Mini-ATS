const { db } = require('./db');

const DATA = [
  ['Aarav Sharma', 'aarav.sharma@example.com', '+91 98450 11001', 'Full Stack Developer', 'React,Node.js,MongoDB', 2, 'LinkedIn', 'Interview', 4],
  ['Priya Nair', 'priya.nair@example.com', '+91 98450 11002', 'Backend Developer', 'Java,Spring Boot,PostgreSQL', 3, 'Referral', 'Offer', 5],
  ['Rohan Mehta', 'rohan.mehta@example.com', '+91 98450 11003', 'Frontend Developer', 'React,TypeScript,CSS', 1.5, 'Naukri', 'Screening', 3],
  ['Ananya Iyer', 'ananya.iyer@example.com', '+91 98450 11004', 'Data Analyst', 'Python,SQL,Tableau', 2, 'LinkedIn', 'Applied', null],
  ['Karthik Reddy', 'karthik.reddy@example.com', '+91 98450 11005', 'Full Stack Developer', 'Vue,Express,MySQL', 0.5, 'Campus', 'Applied', null],
  ['Sneha Kulkarni', 'sneha.kulkarni@example.com', '+91 98450 11006', 'Product Designer', 'Figma,UX Research', 4, 'Referral', 'Interview', 4],
  ['Vikram Singh', 'vikram.singh@example.com', '+91 98450 11007', 'DevOps Engineer', 'AWS,Docker,Kubernetes', 5, 'LinkedIn', 'Hired', 5],
  ['Meera Pillai', 'meera.pillai@example.com', '+91 98450 11008', 'Backend Developer', 'Python,FastAPI,Redis', 2.5, 'Naukri', 'Rejected', 2],
  ['Arjun Das', 'arjun.das@example.com', '+91 98450 11009', 'Full Stack Developer', 'React,Next.js,PostgreSQL', 1, 'Campus', 'Screening', 3],
  ['Divya Rao', 'divya.rao@example.com', '+91 98450 11010', 'QA Engineer', 'Selenium,Cypress,Postman', 3, 'Website', 'Applied', null],
  ['Nikhil Joshi', 'nikhil.joshi@example.com', '+91 98450 11011', 'Frontend Developer', 'Angular,RxJS,SCSS', 2, 'LinkedIn', 'Rejected', 2],
  ['Isha Kapoor', 'isha.kapoor@example.com', '+91 98450 11012', 'Data Analyst', 'Excel,Power BI,SQL', 1, 'Website', 'Interview', 4],
];

const PATH = {
  Applied: ['Applied'],
  Screening: ['Applied', 'Screening'],
  Interview: ['Applied', 'Screening', 'Interview'],
  Offer: ['Applied', 'Screening', 'Interview', 'Offer'],
  Hired: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
  Rejected: ['Applied', 'Screening', 'Rejected'],
};

function seedIfEmpty() {
  const n = db.prepare('SELECT COUNT(*) n FROM candidates').get().n;
  if (n > 0) return false;
  const insC = db.prepare(`INSERT INTO candidates
    (name,email,phone,position,skills,experience_years,source,stage,rating,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,datetime('now', ?), datetime('now', ?))`);
  const insH = db.prepare(`INSERT INTO stage_history (candidate_id, from_stage, to_stage, changed_at)
    VALUES (?,?,?,datetime('now', ?))`);
  db.transaction(() => {
    DATA.forEach((d, i) => {
      const daysAgo = `-${(DATA.length - i) % 12} days`;
      const id = insC.run(...d, daysAgo, daysAgo).lastInsertRowid;
      const steps = PATH[d[7]];
      steps.forEach((s, k) => insH.run(id, k ? steps[k - 1] : null, s, daysAgo));
    });
    db.prepare('INSERT INTO notes (candidate_id, body) VALUES (1, ?)').run('Strong portfolio. Technical round scheduled for Monday.');
    db.prepare('INSERT INTO notes (candidate_id, body) VALUES (2, ?)').run('Great system design discussion. Offer approved by CTO.');
  })();
  return true;
}

module.exports = { seedIfEmpty };
if (require.main === module) console.log(seedIfEmpty() ? 'Seeded' : 'Already has data');
