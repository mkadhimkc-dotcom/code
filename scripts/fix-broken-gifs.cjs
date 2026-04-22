const fs = require('fs');

const broken = [
  'Neutral-Grip-Lat-Pulldown.gif',
  'Stretching_ukwlxf.gif',
  'Wrist-Mobility_Care_1.gif',
  'Wrist-Mobility_Care_2.gif',
  'Wrist-Mobility_Care_3.gif',
  'Wrist-Mobility_Care_4.gif'
];

function fixJson(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.sections.forEach(section => {
    section.exercises.forEach(exercise => {
      if (exercise.images) {
        exercise.images = exercise.images.filter(img =>
          !broken.some(b => img.src.includes(b))
        );
      }
    });
  });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('Fixed:', filePath);
}

fixJson('data/workouts.json');
fixJson('public/data/workouts.json');