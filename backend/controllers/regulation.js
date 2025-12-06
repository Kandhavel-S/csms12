const mongoose = require("mongoose");
const Regulation = require("../models/Regulation");

const parseFormData = (formData) => {
  if (!formData) return null;
  if (typeof formData === "object") return formData;
  try {
    return JSON.parse(formData);
  } catch (err) {
    console.warn("Failed to parse formData payload", err);
    return null;
  }
};

const normalizeDepartment = (incoming, fallback) => {
  if (incoming && typeof incoming === "string" && incoming.trim().length > 0) {
    return incoming.trim();
  }
  return fallback;
};

exports.saveRegulationDraft = async (req, res) => {
  try {
    const { regulationCode, department, formData, changeSummary } = req.body;
    const hodId = req.user?.id;

    if (!regulationCode) {
      return res.status(400).json({ error: "regulationCode is required" });
    }

    const targetDepartment = normalizeDepartment(department, req.user?.department);
    if (!targetDepartment) {
      return res.status(400).json({ error: "department is required" });
    }

    const payload = parseFormData(formData);

    const latest = await Regulation.findOne({ regulationCode, department: targetDepartment, isLatest: true })
      .sort({ version: -1 })
      .exec();

    const now = new Date();

    // If there's an existing draft, update it instead of creating new version
    if (latest && latest.isDraft) {
      latest.formData = payload;
      latest.changeSummary = changeSummary || "";
      latest.lastUpdated = now;
      latest.savedBy = hodId || latest.savedBy;
      latest.savedAt = now;
      await latest.save();

      return res.status(200).json({
        message: `Draft version ${latest.version} updated`,
        regulation: latest,
      });
    }

    // Only create new version if no draft exists
    const nextVersion = latest ? (latest.version || 0) + 1 : 1;

    const draft = new Regulation({
      regulationCode,
      department: targetDepartment,
      hod: hodId || latest?.hod || null,
      curriculumUrl: latest?.curriculumUrl || null,
      status: "Draft",
      isDraft: true,
      version: nextVersion,
      formData: payload,
      changeSummary: changeSummary || "",
      submittedBy: null,
      submittedAt: null,
      lastUpdated: now,
      savedBy: hodId || null,
      savedAt: now,
      isLatest: true,
    });

    await draft.save();

    if (latest) {
      latest.isLatest = false;
      await latest.save();
    }

    return res.status(201).json({
      message: `Draft version ${draft.version} saved`,
      regulation: draft,
    });
  } catch (err) {
    console.error("Failed to save regulation draft", err);
    return res.status(500).json({ error: "Unable to save draft" });
  }
};

exports.getHodRegulations = async (req, res) => {
  try {
    const department = req.user?.department;

    const records = await Regulation.find({ department })
      .sort({ regulationCode: 1, version: -1 })
      .lean();

    const grouped = Object.values(
      records.reduce((acc, doc) => {
        const key = `${doc.regulationCode}::${doc.department}`;
        if (!acc[key]) {
          acc[key] = {
            regulationCode: doc.regulationCode,
            department: doc.department,
            latestVersion: doc.version,
            latestStatus: doc.status,
            lastUpdated: doc.lastUpdated || doc.updatedAt,
            versions: [],
          };
        }

        acc[key].versions.push({
          _id: doc._id,
          version: doc.version,
          status: doc.status,
          isDraft: doc.isDraft,
          lastUpdated: doc.lastUpdated || doc.updatedAt,
          submittedAt: doc.submittedAt,
          curriculumUrl: doc.curriculumUrl,
          savedAt: doc.savedAt || doc.updatedAt,
          savedBy: doc.savedBy,
          changeSummary: doc.changeSummary,
          isLatest: doc.isLatest,
        });

        return acc;
      }, {})
    ).map((entry) => ({
      ...entry,
      versions: entry.versions.sort((a, b) => b.version - a.version),
    }));

    return res.json(grouped);
  } catch (err) {
    console.error("Failed to fetch HOD regulations", err);
    return res.status(500).json({ error: "Unable to fetch regulations" });
  }
};

exports.getRegulationVersion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid regulation id" });
    }

    const record = await Regulation.findById(id)
      .populate("submittedBy", "name email")
      .populate("hod", "name email");

    if (!record) {
      return res.status(404).json({ error: "Regulation not found" });
    }

    if (record.department !== req.user?.department) {
      return res.status(403).json({ error: "Not authorized to view this regulation" });
    }

    return res.json(record);
  } catch (err) {
    console.error("Failed to fetch regulation version", err);
    return res.status(500).json({ error: "Unable to fetch regulation" });
  }
};

exports.getRegulationVersionsByCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: "regulation code is required" });
    }

    const department = req.user?.department;
    const records = await Regulation.find({ regulationCode: code, department })
      .sort({ version: -1 })
      .lean();

    return res.json(records);
  } catch (err) {
    console.error("Failed to list regulation versions", err);
    return res.status(500).json({ error: "Unable to fetch versions" });
  }
};

exports.submitRegulationVersion = async (req, res) => {
  try {
    const { regulationCode, department, fileId, formData, changeSummary } = req.body;
    const hodId = req.user?.id;

    if (!regulationCode || !fileId) {
      return res.status(400).json({ error: "regulationCode and fileId are required" });
    }

    const targetDepartment = normalizeDepartment(department, req.user?.department);
    if (!targetDepartment) {
      return res.status(400).json({ error: "department is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid fileId" });
    }

    const payload = parseFormData(formData);

    let latest = await Regulation.findOne({ regulationCode, department: targetDepartment })
      .sort({ version: -1 })
      .exec();

    if (!latest) {
      return res.status(404).json({ error: "Regulation entry not found" });
    }

    const updateRecord = async (record) => {
      record.curriculumUrl = new mongoose.Types.ObjectId(fileId);
      record.formData = payload ?? record.formData;
      record.status = "Submitted";
      record.isDraft = false;
      record.hod = hodId || record.hod;
      record.submittedBy = hodId || record.submittedBy;
      record.submittedAt = new Date();
      record.lastUpdated = new Date();
      record.savedBy = hodId || record.savedBy;
      record.savedAt = new Date();
      record.isLatest = true;
      record.changeSummary = changeSummary !== undefined ? changeSummary : record.changeSummary;
      await record.save();
      return record;
    };

    if (latest.isDraft || latest.status === "Draft" || latest.status === "Pending") {
      const updated = await updateRecord(latest);
      return res.status(200).json({
        message: `Regulation version ${updated.version} submitted`,
        regulation: updated,
      });
    }

    const now = new Date();
    const newRecord = new Regulation({
      regulationCode,
      department: targetDepartment,
      hod: hodId || latest.hod,
      version: (latest.version || 0) + 1,
      status: "Submitted",
      isDraft: false,
      formData: payload,
      curriculumUrl: new mongoose.Types.ObjectId(fileId),
      submittedBy: hodId || latest.submittedBy,
      submittedAt: now,
      lastUpdated: now,
      changeSummary: changeSummary || "",
      savedBy: hodId || null,
      savedAt: now,
      isLatest: true,
    });

    await newRecord.save();
    latest.isLatest = false;
    await latest.save();
    return res.status(201).json({
      message: `Regulation version ${newRecord.version} submitted`,
      regulation: newRecord,
    });
  } catch (err) {
    console.error("Failed to submit regulation version", err);
    return res.status(500).json({ error: "Unable to submit regulation" });
  }
};
