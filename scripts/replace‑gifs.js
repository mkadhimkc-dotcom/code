const { v2: cloudinary } = require("cloudinary");
const uploads = [
  {
    file: "./replacement-gifs/Bulgarian-Split-Squat.gif",
    public_id: "Bulgarian-Split-Squat_au9tuk",
  },
  {
    file: "./replacement-gifs/Back-Extension.gif",
    public_id: "Back-Extension_igioz5",
  },
  {
    file: "./replacement-gifs/Butterfly-Sit-Up.gif",
    public_id: "Butterfly-Sit-Up_sg4cjg",
  },
  {
    file: "./replacement-gifs/Glute-Cable-Kickback.gif",
    public_id: "Glute-Cable-Kickback_lwvusi",
  },
  {
    file: "./replacement-gifs/Stretching.gif",
    public_id: "Stretching_ukwlxf",
  },
  {
    file: "./replacement-gifs/Wrist-Mobility_Care_1.gif",
    public_id: "Wrist-Mobility_Care_1",
  },
  {
    file: "./replacement-gifs/Wrist-Mobility_Care_2.gif",
    public_id: "Wrist-Mobility_Care_2",
  },
  {
    file: "./replacement-gifs/Wrist-Mobility_Care_3.gif",
    public_id: "Wrist-Mobility_Care_3",
  },
  {
    file: "./replacement-gifs/Wrist-Mobility_Care_4.gif",
    public_id: "Wrist-Mobility_Care_4",
  },
];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  for (const item of uploads) {
    try {
      const result = await cloudinary.uploader.upload(item.file, {
        public_id: item.public_id,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
      });

      console.log(`Updated: ${item.public_id}`);
      console.log(result.secure_url);
    } catch (err) {
      console.error(`Failed: ${item.public_id}`);
      console.error(err.message);
    }
  }
}

run();
