const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const XLSX = require("xlsx");

const Agent = require("../models/agent.model");
const User = require("../models/user.model");
const Account = require("../models/account.model");
const LOB = require("../models/lob.model");
const Carrier = require("../models/carrier.model");
const Policy = require("../models/policy.model");

const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB inside worker
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function processFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (let row of data) {
      // Insert Agent
      let agent = await Agent.findOneAndUpdate(
        { name: row["Agent"] },
        { name: row["Agent"] },
        { upsert: true, new: true }
      );

      // Insert User
      let user = await User.findOneAndUpdate(
        { email: row["email"] },
        {
          firstName: row["first name"],
          dob: row["DOB"],
          address: row["address"],
          phone: row["phone number"],
          state: row["state"],
          zipCode: row["zip code"],
          email: row["email"],
          gender: row["gender"],
          userType: row["userType"],
        },
        { upsert: true, new: true }
      );

      // Insert Account
      let account = await Account.findOneAndUpdate(
        { name: row["Account Name"] },
        { name: row["Account Name"], user: user._id },
        { upsert: true, new: true }
      );

      // Insert Policy Category (LOB)
      let lob = await LOB.findOneAndUpdate(
        { category_name: row["category_name"] },
        { category_name: row["category_name"] },
        { upsert: true, new: true }
      );

      // Insert Carrier
      let carrier = await Carrier.findOneAndUpdate(
        { company_name: row["company_name"] },
        { company_name: row["company_name"] },
        { upsert: true, new: true }
      );

      // Insert Policy Info
      await Policy.findOneAndUpdate(
        { policy_number: row["policy number"] },
        {
          policy_number: row["policy number"],
          policy_start_date: row["policy start date"],
          policy_end_date: row["policy end date"],
          lob: lob._id,
          carrier: carrier._id,
          user: user._id,
        },
        { upsert: true, new: true }
      );
    }

    parentPort.postMessage({ status: "done" });
  } catch (err) {
    parentPort.postMessage({ status: "error", error: err.message });
  } finally {
    fs.unlinkSync(filePath); // remove uploaded file after processing
    mongoose.connection.close();
  }
}

processFile(workerData.filePath);
