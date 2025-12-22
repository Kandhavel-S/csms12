"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription  } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Plus, BookOpen, FileText, Download, TrendingUp, Edit, History, RefreshCcw, Loader2, Trash2, Pencil, Eye, EyeOff } from "lucide-react"
import DashboardLayout from "./dashboard-layout"
import CreateCurriculum from "./curriculum/create-curriculum"
import toast from "react-hot-toast"

interface User {
  _id: string
  email: string
  role: string
  name: string
  department?: string
}

interface Subject {
  _id: string;
  code: string;
  title: string;
  assignedFaculty: string;
  assignedExpert: string;
  syllabusUrl: string;
  status: string;
  lastUpdated: string;
  semester?: number;
  displayOrder?: number;
  regulationId?: string | { _id: string; regulationCode?: string; department?: string } | any;
  regulationCode?: string;
  courseType?: string;
  ltpcCode?: string;
  subjectType?: string;
  department?: string;
}

interface RegulationVersionSummary {
  _id: string;
  version: number;
  status: string;
  isDraft: boolean;
  lastUpdated?: string;
  submittedAt?: string;
  curriculumUrl?: string;
  savedAt?: string;
  savedBy?: string;
  changeSummary?: string;
  isLatest?: boolean;
}

interface RegulationSummary {
  regulationCode: string;
  department: string;
  latestVersion: number;
  latestStatus: string;
  lastUpdated?: string;
  versions: RegulationVersionSummary[];
}

interface RegulationDetail {
  _id?: string;
  regulationCode: string;
  department: string;
  version: number;
  status: string;
  isDraft: boolean;
  changeSummary?: string;
  formData?: any;
  curriculumUrl?: string;
  savedAt?: string;
  savedBy?: string;
  isLatest?: boolean;
}



interface HODDashboardProps {
  user: User
}

export default function HODDashboard({ user }: HODDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false)
  const [isFacultyDialogOpen, setIsFacultyDialogOpen] = useState(false)
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false)
  const [isDeleteSubjectOpen, setIsDeleteSubjectOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<{ id: string; title: string } | null>(null)
  const [newSubjectCode, setNewSubjectCode] = useState("")
  const [newSubjectName, setNewSubjectName] = useState("")
  const [selectedRegulationForSubject, setSelectedRegulationForSubject] = useState<string>("")
  const [courseType, setCourseType] = useState<string>("")
  const [subjectType, setSubjectType] = useState<string>("")
  const [ltpcL, setLtpcL] = useState<string>("")
  const [ltpcT, setLtpcT] = useState<string>("")
  const [ltpcP, setLtpcP] = useState<string>("")
  const [ltpcC, setLtpcC] = useState<string>("")
  const [facultyName, setFacultyName] = useState("")
  const [expertName, setExpertName] = useState("")
  const [facultyForm, setFacultyForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [expertForm, setexpertForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [facultyList, setFacultyList] = useState<{ _id: string; name: string; email: string }[]>([])
  const [expertList, setExpertList] = useState<{ _id: string; name: string; email: string }[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedRegulationId, setSelectedRegulationId] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [trackerRegulationFilter, setTrackerRegulationFilter] = useState<string>("all");
  const [trackerSemesterFilter, setTrackerSemesterFilter] = useState<string>("all");
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<string>("all");
  const [trackerExpertFilter, setTrackerExpertFilter] = useState<string>("all");
  const [regulations, setRegulations] = useState<RegulationSummary[]>([]);
  const [regulationsLoading, setRegulationsLoading] = useState(false);
  const [regulationsError, setRegulationsError] = useState<string | null>(null);
  const [selectedRegulationDetail, setSelectedRegulationDetail] = useState<RegulationDetail | null>(null);
  const [formResetSignal, setFormResetSignal] = useState(0);
  const [loadingVersionId, setLoadingVersionId] = useState<string | null>(null);
  const [isDeleteRegulationOpen, setIsDeleteRegulationOpen] = useState(false);
  const [regulationToDelete, setRegulationToDelete] = useState<RegulationSummary | null>(null);
  const [isRegulationNameDialogOpen, setIsRegulationNameDialogOpen] = useState(false);
  const [newRegulationName, setNewRegulationName] = useState("");
  const [isCreatingRegulation, setIsCreatingRegulation] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [regulationToRename, setRegulationToRename] = useState<RegulationSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamingRegulation, setIsRenamingRegulation] = useState(false);
  const [hasUnsavedCurriculumChanges, setHasUnsavedCurriculumChanges] = useState(false);
  const [isLeaveCurriculumDialogOpen, setIsLeaveCurriculumDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isUpdatingSubject, setIsUpdatingSubject] = useState(false);
  const [isCreatingFaculty, setIsCreatingFaculty] = useState(false);
  const [isCreatingExpert, setIsCreatingExpert] = useState(false);
  const [isApprovingSubject, setIsApprovingSubject] = useState<string | null>(null);
  const [isRejectingSubject, setIsRejectingSubject] = useState<string | null>(null);
  const [isSavingFaculty, setIsSavingFaculty] = useState(false);
  const [isSavingExpert, setIsSavingExpert] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);
  const [isDeletingRegulation, setIsDeletingRegulation] = useState(false);
  const [isAddingElectiveSubject, setIsAddingElectiveSubject] = useState(false);
  const [isCreatingVertical, setIsCreatingVertical] = useState(false);
  const [approveSubjectId, setApproveSubjectId] = useState<string | null>(null);
  const [rejectSubjectId, setRejectSubjectId] = useState<string | null>(null);
  const [courseCodeWarning, setCourseCodeWarning] = useState<string>("")
  const [showFacultyPassword, setShowFacultyPassword] = useState(false)
  const [showExpertPassword, setShowExpertPassword] = useState(false)
  const [facultyPopoverOpen, setFacultyPopoverOpen] = useState(false)
  const [expertPopoverOpen, setExpertPopoverOpen] = useState(false);
  const [isUpdateTitleDialogOpen, setIsUpdateTitleDialogOpen] = useState(false);
  const [verticals, setVerticals] = useState<{id: number; name: string}[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<number | null>(null);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [isCreateVerticalDialogOpen, setIsCreateVerticalDialogOpen] = useState(false);
  const [newVerticalName, setNewVerticalName] = useState("");
  const [isElectiveMode, setIsElectiveMode] = useState(false); // true for Open Electives, false not set
  const [isMandatoryMode, setIsMandatoryMode] = useState(false); // true for Mandatory Courses
  const [selectedElectiveCategory, setSelectedElectiveCategory] = useState<string | null>(null);
  const [isAddElectiveSubjectOpen, setIsAddElectiveSubjectOpen] = useState(false);
  const [electiveSubjectCode, setElectiveSubjectCode] = useState("");
  const [electiveSubjectTitle, setElectiveSubjectTitle] = useState("");
  const [electiveRegulationCode, setElectiveRegulationCode] = useState("");
  const [electiveL, setElectiveL] = useState("");
  const [electiveT, setElectiveT] = useState("");
  const [electiveP, setElectiveP] = useState("");
  const [electiveC, setElectiveC] = useState("");
  const [titleUpdateInfo, setTitleUpdateInfo] = useState<{
    oldTitle: string;
    newTitle: string;
    courseCode: string;
  } | null>(null);



  useEffect(() => {
    const fetchDropdownUsers = async () => {
      const [facultyRes, expertRes] = await Promise.all([
        fetch("http://localhost:5000/api/auth/by-role?role=faculty"),
        fetch("http://localhost:5000/api/auth/by-role?role=subject-expert"),
      ]);

      const facultyNames = await facultyRes.json();
      const expertNames = await expertRes.json();

      setFacultyList(facultyNames);
      setExpertList(expertNames);
    };

    fetchDropdownUsers();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedRegulationId) {
      fetchVerticals();
    }
  }, [selectedRegulationId]);

  const fetchVerticals = async () => {
    if (!selectedRegulationId) return;
    
    try {
      const params = new URLSearchParams();
      params.append("regulationId", selectedRegulationId);
      params.append("department", user.department || "");
      
      const res = await fetch(`http://localhost:5000/api/auth/verticals?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        const mappedVerticals = data.map((v: any) => ({
          id: v._id,
          name: v.name,
        }));
        setVerticals(mappedVerticals);
      }
    } catch (error) {
      console.error("Error fetching verticals:", error);
    }
  };

  const handleCreateVertical = () => {
    setNewVerticalName("");
    setIsCreateVerticalDialogOpen(true);
  };

  const handleConfirmCreateVertical = async () => {
    if (!newVerticalName.trim()) {
      toast.error("Please enter a vertical name");
      return;
    }
    
    if (!selectedRegulationId) {
      toast.error("Please select a regulation first");
      return;
    }

    setIsCreatingVertical(true);
    try {
      const token = localStorage.getItem("token");
      const selectedReg = regulations.find(r => r.versions[0]?._id === selectedRegulationId);
      
      if (!selectedReg) {
        toast.error("Regulation not found");
        return;
      }

      const res = await fetch("http://localhost:5000/api/auth/verticals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newVerticalName.trim(),
          regulationId: selectedRegulationId,
          regulationCode: selectedReg.regulationCode,
          department: user.department || "",
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create vertical");
      }

      // Add to local state
      setVerticals(prev => [...prev, { id: data._id, name: data.name }]);
      setIsCreateVerticalDialogOpen(false);
      setNewVerticalName("");
      toast.success(`Vertical "${newVerticalName}" created successfully`);
    } catch (error: any) {
      console.error("Error creating vertical:", error);
      toast.error(error.message || "Failed to create vertical");
    } finally {
      setIsCreatingVertical(false);
    }
  };
  
  // Reset unsaved order flag when changing semester or regulation
  useEffect(() => {
    setHasUnsavedOrder(false);
  }, [selectedRegulationId, selectedSemester]);
  
  const fetchSubjects = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/get-subjects?department=${user.department}`);
      const data = await res.json();
      setSubjects(data);
      console.log("📦 Subjects fetched:", data);
      console.log("📦 Sample subject regulationId:", data[0]?.regulationId);
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
    }
  };

  const fetchRegulations = useCallback(async () => {
    setRegulationsLoading(true);
    setRegulationsError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const res = await fetch("http://localhost:5000/api/auth/hod/regulations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load regulations");
      }

      setRegulations(data);
    } catch (error: any) {
      console.error("❌ Error fetching regulations:", error);
      setRegulationsError(error.message || "Failed to load regulations");
    } finally {
      setRegulationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegulations();
  }, [fetchRegulations]);

  // Populate regulation code when elective dialog opens
  useEffect(() => {
    if (isAddElectiveSubjectOpen && selectedRegulationId) {
      const selectedReg = regulations.find(r => r.versions[0]?._id === selectedRegulationId);
      if (selectedReg) {
        setElectiveRegulationCode(selectedReg.regulationCode);
      }
    }
  }, [isAddElectiveSubjectOpen, selectedRegulationId, regulations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Draft":
        return "bg-yellow-100 text-yellow-800"
      case "Sent to HOD":
        return "bg-purple-100 text-purple-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const normalizeId = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
      const potentialId = (value as { _id?: string })._id;
      if (potentialId) return potentialId;
      if (typeof (value as { toString?: () => string }).toString === "function") {
        return (value as { toString: () => string }).toString();
      }
    }
    return null;
  };

  const describeSavedBy = (value?: unknown) => {
    const normalized = normalizeId(value);
    if (!normalized) return "";
    if (user?._id && normalized === user._id) {
      return "Saved by you";
    }
    return "Saved by collaborator";
  };

  const formatSavedMeta = (savedAt?: string, isLatest?: boolean, isDraft?: boolean) => {
    const base = formatDate(savedAt);
    if (isLatest) return `${base} • Current`;
    if (isDraft) return `${base} • Draft snapshot`;
    return base;
  };

  const handleStartFreshRegulation = () => {
    setNewRegulationName("");
    setIsRegulationNameDialogOpen(true);
  };

  const handleCreateNewRegulation = async () => {
    if (!newRegulationName.trim()) {
      toast.error("Please enter a regulation name");
      return;
    }

    setIsCreatingRegulation(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const departmentName = user.department || "";
      if (!departmentName.trim()) {
        throw new Error("Department is required");
      }

      // Create the regulation with version 1
      const res = await fetch("http://localhost:5000/api/auth/hod/regulations/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          regulationCode: newRegulationName,
          department: departmentName,
          formData: {},
          changeSummary: "Initial version",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create regulation");

      toast.success("Regulation created successfully");
      
      // Set the newly created regulation as selected
      setSelectedRegulationDetail({
        regulationCode: newRegulationName,
        department: departmentName,
        version: 1,
        status: "Draft",
        isDraft: true,
        changeSummary: "Initial version",
        formData: null,
        savedAt: new Date().toISOString(),
        savedBy: user._id,
        isLatest: true,
      });
      
      setFormResetSignal((prev) => prev + 1);
      setActiveTab("curriculum");
      setIsRegulationNameDialogOpen(false);
      
      // Refresh regulations list
      fetchRegulations();
    } catch (error: any) {
      console.error("Create regulation error", error);
      toast.error(error.message || "Unable to create regulation");
    } finally {
      setIsCreatingRegulation(false);
    }
  };

  const handleSelectRegulationVersion = async (versionId: string) => {
    if (!versionId) return;
    setLoadingVersionId(versionId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const res = await fetch(`http://localhost:5000/api/auth/hod/regulation-version/${versionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to open regulation version");
      }

      const resolvedSavedBy =
        typeof data.savedBy === "object" && data.savedBy?._id
          ? data.savedBy._id
          : data.savedBy;

      setSelectedRegulationDetail({
        _id: data._id,
        regulationCode: data.regulationCode,
        department: data.department,
        version: data.version,
        status: data.status,
        isDraft: data.isDraft,
        changeSummary: data.changeSummary,
        formData: data.formData,
        curriculumUrl: data.curriculumUrl,
        savedAt: data.savedAt,
        savedBy: resolvedSavedBy,
        isLatest: data.isLatest,
      });
      setFormResetSignal((prev) => prev + 1);
      setActiveTab("curriculum");
    } catch (error: any) {
      console.error("❌ Unable to load regulation version:", error);
      toast.error(error.message || "Failed to open regulation version");
    } finally {
      setLoadingVersionId(null);
    }
  };

  const handleCourseCodeChange = async (code: string) => {
    setNewSubjectCode(code);
    setCourseCodeWarning(""); // Clear previous warning

    console.log("=== handleCourseCodeChange called ===");
    console.log("Course code entered:", code);

    if (!code.trim()) {
      setNewSubjectName(""); // Clear title if course code is empty
      console.log("Code is empty, clearing title");
      return;
    }
    
    // Use either selectedRegulationForSubject or selectedRegulationId
    const regulationIdToUse = selectedRegulationForSubject || selectedRegulationId;
    
    if (!regulationIdToUse) {
      console.log("No regulation selected");
      return;
    }

    console.log("Using regulation ID:", regulationIdToUse);

    try {
      // Get the regulation code for comparison
      const selectedReg = regulations.find(r => r.versions[0]?._id === regulationIdToUse);
      const regCode = selectedReg?.regulationCode;
      
      console.log("Selected regulation:", selectedReg);
      console.log("Regulation code:", regCode);
      
      if (!regCode) {
        console.log("No regulation code found");
        return;
      }

      // Fetch all subjects (no filter) to check across departments
      const res = await fetch(
        `http://localhost:5000/api/auth/get-subjects`
      );
      const allSubjects = await res.json();
      
      console.log("All subjects fetched:", allSubjects.length);
      
      // Filter by regulation code (string comparison)
      const existingSubjects = allSubjects.filter(
        (s: Subject) => s.regulationCode === regCode
      );
      
      console.log("Subjects in same regulation:", existingSubjects.length);
      console.log("Existing subjects:", existingSubjects);
      
      const existingInSameDept = existingSubjects.find(
        (s: Subject) => s.code === code.trim() && s.department === user.department
      );
      
      const existingInOtherDept = existingSubjects.find(
        (s: Subject) => s.code === code.trim() && s.department !== user.department
      );

      console.log("Existing in same dept:", existingInSameDept);
      console.log("Existing in other dept:", existingInOtherDept);
      console.log("User department:", user.department);

      if (existingInSameDept) {
        console.log("Found duplicate in same department");
        setCourseCodeWarning(`⚠️ Course code "${code}" already exists in this department for this regulation.`);
        setNewSubjectName(""); // Clear title for duplicate in same department
      } else if (existingInOtherDept) {
        // Auto-fill the title from the other department
        console.log("Found in other department, auto-filling title:", existingInOtherDept.title);
        setNewSubjectName(existingInOtherDept.title);
        setCourseCodeWarning(`ℹ️ Course code "${code}" exists in ${existingInOtherDept.department} department. Title auto-filled. Same title is required for cross-department courses.`);
      } else {
        // Clear title if no existing course found
        console.log("No existing course found, clearing title");
        setNewSubjectName("");
      }
    } catch (error) {
      console.error("Error checking course code:", error);
    }
  };

  const handleAddSubject = async () => {
  if (newSubjectCode && newSubjectName && (selectedRegulationForSubject || selectedRegulationId) && (selectedSemester || selectedVertical)) {
    try {
      const regulationId = selectedRegulationForSubject || selectedRegulationId;
      
      const selectedReg = regulations.find(r => r.versions[0]?._id === regulationId);
      const regCode = selectedReg?.regulationCode;
      
      console.log("Selected regulation:", selectedReg);
      console.log("Regulation code to save:", regCode);
      
      if (!regCode) {
        toast.error("Could not find regulation code");
        return;
      }
      
      // Fetch all subjects to check across departments
      const checkRes = await fetch(
        `http://localhost:5000/api/auth/get-subjects`
      );
      const allSubjects = await checkRes.json();
      
      // Filter by regulation code (string comparison)
      const existingSubjects = allSubjects.filter(
        (s: Subject) => s.regulationCode === regCode
      );
      
      const existingInSameDept = existingSubjects.find(
        (s: Subject) => s.code === newSubjectCode.trim() && s.department === user.department
      );
      
      const existingInOtherDept = existingSubjects.find(
        (s: Subject) => s.code === newSubjectCode.trim() && s.department !== user.department
      );

      // If course code exists in this department and regulation, prevent adding it again
      if (existingInSameDept) {
        toast.error(
          `Course code "${newSubjectCode}" already exists in this department for this regulation. Each course code can only be added once per department per regulation.`
        );
        return;
      }
      
      // If course code exists in another department and title was changed, update all
      if (existingInOtherDept && existingInOtherDept.title !== newSubjectName.trim()) {
        // User has modified the auto-filled title - show confirmation dialog
        setTitleUpdateInfo({
          oldTitle: existingInOtherDept.title,
          newTitle: newSubjectName.trim(),
          courseCode: newSubjectCode
        });
        setIsUpdateTitleDialogOpen(true);
        return;
      }

      setIsAddingSubject(true);
      // Get the next display order for this semester and department
      const semesterSubjects = existingSubjects.filter(
        (s: Subject) => s.semester === selectedSemester && s.department === user.department
      );
      const maxOrder = semesterSubjects.length === 0 
        ? -1 
        : Math.max(...semesterSubjects.map((s: Subject) => s.displayOrder || 0));

      const selectedVerticalObj = verticals.find(v => v.id === selectedVertical);
      const verticalType = selectedVerticalObj ? selectedVerticalObj.name : "";
      
      const requestBody = {
        code: newSubjectCode,
        title: newSubjectName,
        assignedFaculty: "",
        assignedExpert: "",
        createdBy: user._id,
        regulationId: regulationId,
        regulationCode: regCode,
        department: user.department || "",
        semester: selectedSemester || 0,
        displayOrder: maxOrder + 1,
        courseType: courseType || "",
        subjectType: selectedVertical ? verticalType : (subjectType || ""),
        ltpcCode: `${ltpcL}-${ltpcT}-${ltpcP}-${ltpcC}`
      };

      console.log("Sending request body:", requestBody);

      const res = await fetch("http://localhost:5000/api/auth/add-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error adding subject");

      // Refetch subjects after adding
      fetchSubjects();

      // No need to manually update state, fetchSubjects handles it

      setNewSubjectCode("");
      setNewSubjectName("");
      setSelectedRegulationForSubject("");
      setCourseType("");
      setSubjectType("");
      setLtpcL("");
      setLtpcT("");
      setLtpcP("");
      setLtpcC("");
      setCourseCodeWarning("");
      setIsAddSubjectOpen(false);
      toast.success("Subject added successfully");
    } catch (err) {
      console.error("Add subject failed:", err);
      toast.error("Failed to add subject");
    } finally {
      setIsAddingSubject(false);
    }
  } else {
    toast.error("Please fill all fields including regulation");
  }
};

const handleConfirmTitleUpdate = async () => {
  if (!titleUpdateInfo) return;

  try {
    const regulationId = selectedRegulationForSubject || selectedRegulationId;
    const selectedReg = regulations.find(r => r.versions[0]?._id === regulationId);
    const regCode = selectedReg?.regulationCode;

    if (!regCode) {
      toast.error("Could not find regulation code");
      setIsUpdateTitleDialogOpen(false);
      return;
    }

    // Update all subjects with this course code in this regulation
    const updateRes = await fetch("http://localhost:5000/api/auth/update-course-titles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode: titleUpdateInfo.courseCode.trim(),
        regulationCode: regCode,
        newTitle: titleUpdateInfo.newTitle
      }),
    });
    
    if (!updateRes.ok) {
      const errorData = await updateRes.json();
      throw new Error(errorData.error || "Failed to update titles");
    }
    
    toast.success(`Updated title for all subjects with course code "${titleUpdateInfo.courseCode}" in this regulation`);
    
    // Close dialog and proceed with adding the subject
    setIsUpdateTitleDialogOpen(false);
    setTitleUpdateInfo(null);
    
    // Now add the subject by calling handleAddSubject again
    // The check will pass since titles now match
    handleAddSubject();
  } catch (error: any) {
    toast.error(`Failed to update existing titles: ${error.message}`);
    setIsUpdateTitleDialogOpen(false);
    setTitleUpdateInfo(null);
  }
};

const handleCancelTitleUpdate = () => {
  setIsUpdateTitleDialogOpen(false);
  setTitleUpdateInfo(null);
};



  const handleAssignFaculty = (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setIsFacultyDialogOpen(true)
  }

  const handleAssignExpert = (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setIsExpertDialogOpen(true)
  }

  const handleSaveFaculty = async () => {
    if (!selectedSubjectId || !selectedFaculty) return;

    setIsSavingFaculty(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/update-fac-exp", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          assignedFaculty: selectedFaculty
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign faculty");

      console.log("✅ Faculty assigned:", data);
      fetchSubjects(); // re-fetch subjects from DB
      toast.success("Faculty assigned successfully");
    } catch (err) {
      console.error("Error assigning faculty:", err);
      toast.error("Failed to assign faculty");
    } finally {
      setIsSavingFaculty(false);
    }

    setIsFacultyDialogOpen(false);
  };

  const handleSaveExpert = async () => {
    if (!selectedSubjectId || !selectedExpert) return;

    setIsSavingExpert(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/update-fac-exp", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          assignedExpert: selectedExpert,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign expert");

      console.log("✅ Expert assigned:", data);
      fetchSubjects(); // re-fetch subjects from DB
      toast.success("Expert assigned successfully");
    } catch (err) {
      console.error("Error assigning expert:", err);
      toast.error("Failed to assign expert");
    } finally {
      setIsSavingExpert(false);
    }

    setIsExpertDialogOpen(false);
  };


  const handleEditSubject = (subject: any) => {
    setSelectedSubjectId(subject._id)
    setNewSubjectCode(subject.code)
    setNewSubjectName(subject.title)
    setFacultyName(subject.assignedFaculty)
    setExpertName(subject.assignedExpert)
    setIsEditSubjectOpen(true)
    setSelectedFaculty(subject.assignedFaculty);
    setSelectedExpert(subject.assignedExpert);
  }

  const handleUpdateSubject = async () => {
  if (!selectedSubjectId) return;

  setIsUpdatingSubject(true);
  try {
    const res = await fetch(`http://localhost:5000/api/auth/edit-subjects/${selectedSubjectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: newSubjectCode,
        title: newSubjectName,
        assignedFaculty: selectedFaculty,
        assignedExpert: selectedExpert,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update subject");
    }

    const updated = await res.json();

    // Update local state
    setSubjects((prev) =>
      prev.map((s) => (s._id === updated._id ? updated : s))
    );

    setIsEditSubjectOpen(false);
    setSelectedSubjectId(null);
    setNewSubjectCode("");
    setNewSubjectName("");
    setSelectedFaculty(null);
    setSelectedExpert(null);
    toast.success("Subject updated successfully");
  } catch (err) {
    console.error("Update failed:", err);
    toast.error("Error updating subject");
  } finally {
    setIsUpdatingSubject(false);
  }
};



    const assignFaculty = async () => {
      setIsCreatingFaculty(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in again.");
        }

        const res = await fetch("http://localhost:5000/api/auth/assign-faculty", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(facultyForm),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create faculty");

        toast.success("Faculty created successfully");
        setFacultyForm({
          name: "",
          email: "",
          password: "",
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
          toast.error(err.message);
        } else {
          console.error("An unexpected error occurred", err);
          toast.error("An unexpected error occurred");
        }
      } finally {
        setIsCreatingFaculty(false);
      }
    };

    const getFacultyNameById = (id: string | undefined): string | null => {
      const found = facultyList.find((f) => f._id === id);
      return found ? found.name : null;
    };

    const handleApprove = async (subjectId: string) => {
  setIsApprovingSubject(subjectId);
  try {
    const res = await fetch(`http://localhost:5000/api/auth/subject/${subjectId}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to approve subject");

    const { subject } = await res.json();

    // Update the local state with the new subject data
    setSubjects((prevSubjects) =>
      prevSubjects.map((subj) =>
        subj._id === subjectId ? { ...subj, status: "Approved", lastUpdated: subject.lastUpdated } : subj
      )
    );

    toast.success("Subject approved successfully");
  } catch (err) {
    console.error("Error approving subject:", err);
    toast.error("Error approving subject");
  } finally {
    setIsApprovingSubject(null);
  }
};


const handleReject = async (subjectId: string) => {
  setIsRejectingSubject(subjectId);
  try {
    const res = await fetch(`http://localhost:5000/api/auth/subject/${subjectId}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to reject subject");

    const { subject } = await res.json();

    // Update the local state with the new subject data
    setSubjects((prevSubjects) =>
      prevSubjects.map((subj) =>
        subj._id === subjectId ? { ...subj, status: "Rejected", lastUpdated: subject.lastUpdated } : subj
      )
    );

    toast.success("Subject rejected successfully");
  } catch (err) {
    console.error("Error rejecting subject:", err);
    toast.error("Error rejecting subject");
  } finally {
    setIsRejectingSubject(null);
  }
};

const handleDeleteSubject = async () => {
  if (!subjectToDelete) return;

  setIsDeletingSubject(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/auth/delete-subject/${subjectToDelete.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete subject");
    }

    const data = await res.json();
    toast.success(data.message || "Subject deleted successfully");
    
    // Refresh the subjects list
    fetchSubjects();
    
    // Close dialog and reset state
    setIsDeleteSubjectOpen(false);
    setSubjectToDelete(null);
  } catch (err: any) {
    console.error("Error deleting subject:", err);
    toast.error(err.message || "Failed to delete subject");
  } finally {
    setIsDeletingSubject(false);
  }
};

const handleDeleteRegulation = async () => {
  if (!regulationToDelete) return;

  setIsDeletingRegulation(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/auth/regulations/${regulationToDelete.regulationCode}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete regulation");
    }

    const data = await res.json();
    toast.success(data.message || "Regulation deleted successfully");
    
    // Refresh the regulations list
    fetchRegulations();
    
    // Close dialog and reset state
    setIsDeleteRegulationOpen(false);
    setRegulationToDelete(null);
  } catch (err: any) {
    console.error("Error deleting regulation:", err);
    toast.error(err.message || "Failed to delete regulation");
  } finally {
    setIsDeletingRegulation(false);
  }
};

const handleRenameRegulation = async () => {
  if (!regulationToRename || !renameValue.trim()) {
    toast.error("Please enter a valid regulation name");
    return;
  }

  setIsRenamingRegulation(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/auth/regulations/${regulationToRename.regulationCode}/rename`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newRegulationCode: renameValue,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to rename regulation");
    }

    const data = await res.json();
    toast.success(data.message || "Regulation renamed successfully");
    
    // Refresh the regulations list
    fetchRegulations();
    
    // Close dialog and reset state
    setIsRenameDialogOpen(false);
    setRegulationToRename(null);
    setRenameValue("");
  } catch (err: any) {
    console.error("Error renaming regulation:", err);
    toast.error(err.message || "Failed to rename regulation");
  } finally {
    setIsRenamingRegulation(false);
  }
};

const handleTabChange = (newTab: string) => {
  // If leaving curriculum tab and there are unsaved changes, show confirmation dialog
  if (activeTab === "curriculum" && newTab !== "curriculum" && hasUnsavedCurriculumChanges) {
    setPendingTab(newTab);
    setIsLeaveCurriculumDialogOpen(true);
  } else {
    setActiveTab(newTab);
  }
};

const handleSaveAndLeave = async () => {
  // Trigger save functionality in CreateCurriculum component
  // This will be handled by passing a ref or callback
  const saveButton = document.querySelector('[data-save-curriculum-button]') as HTMLButtonElement;
  if (saveButton) {
    saveButton.click();
    // Wait a bit for save to complete
    setTimeout(() => {
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
        setHasUnsavedCurriculumChanges(false);
      }
      setIsLeaveCurriculumDialogOpen(false);
    }, 500);
  }
};

const handleLeaveWithoutSaving = () => {
  if (pendingTab) {
    setActiveTab(pendingTab);
    setPendingTab(null);
    setHasUnsavedCurriculumChanges(false);
  }
  setIsLeaveCurriculumDialogOpen(false);
};



    const getExpertNameById = (id: string | undefined): string | null => {
      const found = expertList.find((e) => e._id === id);
      return found ? found.name : null;
    };      

    const totalSubjects = subjects.length;
    const completedSubjects = subjects.filter((s) => s.status === "Approved").length;

    const completionRate = totalSubjects > 0 
      ? Math.round((completedSubjects / totalSubjects) * 100) 
      : 0;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjects.length}</div>
                  <p className="text-xs text-muted-foreground">This semester</p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Syllabi</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {subjects.filter((item) => item.status !== "Approved" && item.status!=="Sent to HOD").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting submission</p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <p className="text-xs text-muted-foreground">Overall progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Recent Syllabus Activity</CardTitle>
                <CardDescription>Latest updates from faculty members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects
                    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item._id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.title} syllabus
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {getFacultyNameById(item.assignedFaculty)} •{" "}
                            {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : "Not updated"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(item.status === "Sent to HOD" ? "Received" : item.status)}>{item.status === "Sent to HOD" ? "Received" : item.status}</Badge>
                      </div>
                  ))}

                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "subjects":
        const selectedRegulation = selectedRegulationId 
          ? regulations.find(r => r.versions[0]?._id === selectedRegulationId)
          : null;
        
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        const filteredSubjects = (selectedSemester || selectedVertical || selectedElectiveCategory) && selectedRegulationId
          ? subjects
              .filter(s => {
                const regIdMatch = s.regulationId === selectedRegulationId || 
                                  s.regulationId?._id === selectedRegulationId ||
                                  s.regulationId?.toString() === selectedRegulationId;
                
                if (selectedSemester) {
                  const semMatch = s.semester === selectedSemester;
                  return regIdMatch && semMatch;
                } else if (selectedVertical) {
                  const selectedVerticalObj = verticals.find(v => v.id === selectedVertical);
                  const verticalName = selectedVerticalObj?.name.toLowerCase() || '';
                  return regIdMatch && s.subjectType?.toLowerCase().includes(verticalName);
                } else if (selectedElectiveCategory) {
                  return regIdMatch && s.subjectType?.includes(selectedElectiveCategory);
                }
                return false;
              })
              .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          : [];

        console.log("Filtered subjects for display:", filteredSubjects.length);

        const handleDragStart = (subjectId: string) => {
          setDraggedSubjectId(subjectId);
        };

        const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
        };

        const handleDrop = (targetSubjectId: string) => {
          if (!draggedSubjectId || draggedSubjectId === targetSubjectId) {
            setDraggedSubjectId(null);
            return;
          }

          const draggedIndex = filteredSubjects.findIndex(s => s._id === draggedSubjectId);
          const targetIndex = filteredSubjects.findIndex(s => s._id === targetSubjectId);

          if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedSubjectId(null);
            return;
          }

          // Reorder locally
          const newSubjects = [...filteredSubjects];
          const [removed] = newSubjects.splice(draggedIndex, 1);
          newSubjects.splice(targetIndex, 0, removed);

          // Update display order
          const updatedSubjects = newSubjects.map((s, index) => ({
            ...s,
            displayOrder: index
          }));

          // Update state - remove old subjects from this semester and add updated ones
          setSubjects(prev => {
            const filtered = prev.filter(s => {
              const regIdMatch = s.regulationId === selectedRegulationId || 
                                s.regulationId?._id === selectedRegulationId ||
                                s.regulationId?.toString() === selectedRegulationId;
              const semMatch = s.semester === selectedSemester;
              // Keep subjects that DON'T match (i.e., remove subjects from current semester)
              return !(regIdMatch && semMatch);
            });
            return [...filtered, ...updatedSubjects];
          });

          // Mark as having unsaved changes
          setHasUnsavedOrder(true);
          setDraggedSubjectId(null);
        };

        const handleSaveOrder = async () => {
          if (!hasUnsavedOrder) return;
          
          setIsSavingOrder(true);
          try {
            const response = await fetch('http://localhost:5000/api/auth/update-subject-order', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subjectIds: filteredSubjects.map(s => ({ id: s._id, displayOrder: s.displayOrder }))
              })
            });

            if (!response.ok) {
              throw new Error('Failed to save order');
            }

            toast.success('Subject order saved successfully');
            setHasUnsavedOrder(false);
          } catch (err) {
            console.error('Failed to update subject order:', err);
            toast.error('Failed to save subject order');
          } finally {
            setIsSavingOrder(false);
          }
        };

        return (
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subject Allocation
                  </CardTitle>
                  <CardDescription>
                    Navigate: Regulations → Semesters → Subjects
                    {selectedSemester && " • Drag to reorder subjects"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedSemester && hasUnsavedOrder && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700" 
                      onClick={handleSaveOrder}
                      disabled={isSavingOrder}
                    >
                      {isSavingOrder ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                      ) : (
                        <>Save Order</>
                      )}
                    </Button>
                  )}
                  {(selectedSemester || selectedVertical) && (
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsAddSubjectOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subject
                    </Button>
                  )}
                  {selectedElectiveCategory && (
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsAddElectiveSubjectOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subject
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Faculty
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Faculty</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={facultyForm.name}
                            onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                            placeholder="Enter name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={facultyForm.email}
                            onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                            placeholder="Enter email"
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              type={showFacultyPassword ? "text" : "password"}
                              value={facultyForm.password}
                              onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                              placeholder="Enter password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showFacultyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={isCreatingFaculty}
                          onClick={assignFaculty}
                        >
                          {isCreatingFaculty && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isCreatingFaculty ? "Creating..." : "Create Faculty"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expert
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Expert</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={expertForm.name}
                            onChange={(e) => setexpertForm({ ...expertForm, name: e.target.value })}
                            placeholder="Enter expert name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={expertForm.email}
                            onChange={(e) => setexpertForm({ ...expertForm, email: e.target.value })}
                            placeholder="Enter expert email"
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              type={showExpertPassword ? "text" : "password"}
                              value={expertForm.password}
                              onChange={(e) => setexpertForm({ ...expertForm, password: e.target.value })}
                              placeholder="Enter password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowExpertPassword(!showExpertPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showExpertPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={isCreatingExpert}
                          onClick={async () => {
                            setIsCreatingExpert(true);
                            try {
                              const res = await fetch("http://localhost:5000/api/auth/assign-expert", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  name: expertForm.name,
                                  email: expertForm.email,
                                  password: expertForm.password,
                                  role: "subject-expert",
                                }),
                              });

                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || "Failed to create expert");

                              toast.success("Expert created successfully");

                              setexpertForm({
                                name: "",
                                email: "",
                                password: "",
                              });
                            } catch (err: any) {
                              console.error("Error creating expert:", err.message);
                              toast.error(err.message || "Failed to create expert");
                            } finally {
                              setIsCreatingExpert(false);
                            }
                          }}
                        >
                          {isCreatingExpert && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isCreatingExpert ? "Creating..." : "Add Expert"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Breadcrumb Navigation */}
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span 
                  className="cursor-pointer hover:text-purple-600" 
                  onClick={() => { setSelectedRegulationId(null); setSelectedSemester(null); setSelectedVertical(null); setIsVerticalMode(false); setVerticals([]); setSelectedElectiveCategory(null); setIsElectiveMode(false); setIsMandatoryMode(false); }}
                >
                  Regulations
                </span>
                {selectedRegulation && (
                  <>
                    <span>/</span>
                    <span 
                      className="cursor-pointer hover:text-purple-600"
                      onClick={() => { setSelectedSemester(null); setSelectedVertical(null); setIsVerticalMode(false); setSelectedElectiveCategory(null); setIsElectiveMode(false); setIsMandatoryMode(false); }}
                    >
                      {selectedRegulation.regulationCode}
                    </span>
                  </>
                )}
                {isVerticalMode && !selectedVertical && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">Vertical Courses</span>
                  </>
                )}
                {selectedSemester && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">Semester {selectedSemester}</span>
                  </>
                )}
                {selectedVertical && (
                  <>
                    <span>/</span>
                    <span 
                      className="cursor-pointer hover:text-purple-600"
                      onClick={() => setSelectedVertical(null)}
                    >
                      Vertical Courses
                    </span>
                    <span>/</span>
                    <span className="text-foreground font-medium">{verticals.find(v => v.id === selectedVertical)?.name || selectedVertical}</span>
                  </>
                )}
                {isElectiveMode && !selectedElectiveCategory && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">Open Electives</span>
                  </>
                )}
                {isMandatoryMode && !selectedElectiveCategory && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">Mandatory Courses</span>
                  </>
                )}
                {selectedElectiveCategory && (isElectiveMode || isMandatoryMode) && (
                  <>
                    <span>/</span>
                    <span 
                      className="cursor-pointer hover:text-purple-600"
                      onClick={() => setSelectedElectiveCategory(null)}
                    >
                      {selectedElectiveCategory?.includes('Open Electives') ? 'Open Electives' : 'Mandatory Courses'}
                    </span>
                    <span>/</span>
                    <span className="text-foreground font-medium">{selectedElectiveCategory}</span>
                  </>
                )}
              </div>

              {/* Directory View: Regulations */}
              {!selectedRegulationId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regulations.map((reg) => (
                    <Card 
                      key={reg.regulationCode}
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => setSelectedRegulationId(reg.versions[0]?._id || reg.regulationCode)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          {reg.regulationCode}
                        </CardTitle>
                        <CardDescription>{reg.department}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {subjects.filter(s => {
                            const regId = reg.versions[0]?._id || reg.regulationCode;
                            return s.regulationId === regId || 
                                   s.regulationId?._id === regId ||
                                   s.regulationId?.toString() === regId;
                          }).length} subjects
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Directory View: Semesters */}
              {selectedRegulationId && !selectedSemester && !selectedVertical && !isVerticalMode && !isElectiveMode && !isMandatoryMode && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-purple-700 mb-3">Semesters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                        const semesterSubjects = subjects.filter(
                          s => {
                            const regIdMatch = s.regulationId === selectedRegulationId || 
                                              s.regulationId?._id === selectedRegulationId ||
                                              s.regulationId?.toString() === selectedRegulationId;
                            const semMatch = s.semester === sem;
                            return regIdMatch && semMatch;
                          }
                        );
                        console.log(`Semester ${sem} subjects:`, semesterSubjects.length, "selectedRegId:", selectedRegulationId);
                        return (
                          <Card 
                            key={sem}
                            className="cursor-pointer hover:border-purple-500 transition-colors"
                            onClick={() => setSelectedSemester(sem)}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg">Semester {sem}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {semesterSubjects.length} subjects
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-700 mb-3">Special Categories</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card 
                        className="cursor-pointer hover:border-purple-500 transition-colors"
                        onClick={() => {
                          setIsVerticalMode(true);
                          setSelectedSemester(null);
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            Vertical Courses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {verticals.length} verticals created
                          </p>
                        </CardContent>
                      </Card>

                      <Card 
                        className="cursor-pointer hover:border-purple-500 transition-colors"
                        onClick={() => {
                          setIsElectiveMode(true);
                          setSelectedSemester(null);
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            Open Electives
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {subjects.filter(s => {
                              const regIdMatch = s.regulationId === selectedRegulationId || 
                                                s.regulationId?._id === selectedRegulationId ||
                                                s.regulationId?.toString() === selectedRegulationId;
                              return regIdMatch && s.courseType === 'OEC';
                            }).length} total courses
                          </p>
                        </CardContent>
                      </Card>

                      <Card 
                        className="cursor-pointer hover:border-purple-500 transition-colors"
                        onClick={() => {
                          setIsMandatoryMode(true);
                          setSelectedSemester(null);
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            Mandatory Courses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {subjects.filter(s => {
                              const regIdMatch = s.regulationId === selectedRegulationId || 
                                                s.regulationId?._id === selectedRegulationId ||
                                                s.regulationId?.toString() === selectedRegulationId;
                              return regIdMatch && s.courseType === 'MC';
                            }).length} total courses
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}

              {/* Directory View: Open Electives */}
              {selectedRegulationId && isElectiveMode && !selectedElectiveCategory && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-purple-700 mb-3">Open Electives</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card 
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => setSelectedElectiveCategory('Open Electives - I')}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Open Electives - I</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {subjects.filter(s => {
                            const regIdMatch = s.regulationId === selectedRegulationId || 
                                              s.regulationId?._id === selectedRegulationId ||
                                              s.regulationId?.toString() === selectedRegulationId;
                            return regIdMatch && s.courseType === 'OEC' && s.subjectType?.includes('Open Electives - I');
                          }).length} courses
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => setSelectedElectiveCategory('Open Electives - II')}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Open Electives - II</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {subjects.filter(s => {
                            const regIdMatch = s.regulationId === selectedRegulationId || 
                                              s.regulationId?._id === selectedRegulationId ||
                                              s.regulationId?.toString() === selectedRegulationId;
                            return regIdMatch && s.courseType === 'OEC' && s.subjectType?.includes('Open Electives - II');
                          }).length} courses
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Directory View: Mandatory Courses */}
              {selectedRegulationId && isMandatoryMode && !selectedElectiveCategory && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-purple-700 mb-3">Mandatory Courses</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card 
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => setSelectedElectiveCategory('Mandatory Course - I')}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Mandatory Course - I</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {subjects.filter(s => {
                            const regIdMatch = s.regulationId === selectedRegulationId || 
                                              s.regulationId?._id === selectedRegulationId ||
                                              s.regulationId?.toString() === selectedRegulationId;
                            return regIdMatch && s.courseType === 'MC' && s.subjectType?.includes('Mandatory Course - I');
                          }).length} courses
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={() => setSelectedElectiveCategory('Mandatory Course - II')}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">Mandatory Course - II</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {subjects.filter(s => {
                            const regIdMatch = s.regulationId === selectedRegulationId || 
                                              s.regulationId?._id === selectedRegulationId ||
                                              s.regulationId?.toString() === selectedRegulationId;
                            return regIdMatch && s.courseType === 'MC' && s.subjectType?.includes('Mandatory Course - II');
                          }).length} courses
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Directory View: Verticals */}
              {selectedRegulationId && isVerticalMode && !selectedVertical && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-purple-700">Vertical Courses</h3>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateVertical();
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                      disabled={isCreatingVertical}
                    >
                      {isCreatingVertical && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      <Plus className="h-4 w-4 mr-1" />
                      Create Vertical
                    </Button>
                  </div>
                  {verticals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No verticals created yet.</p>
                      <p className="text-sm">Click "Create Vertical" to add one.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {verticals.map((vertical, index) => {
                        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                        const verticalSubjects = subjects.filter(s => {
                          const regIdMatch = s.regulationId === selectedRegulationId || 
                                            s.regulationId?._id === selectedRegulationId ||
                                            s.regulationId?.toString() === selectedRegulationId;
                          return regIdMatch && s.subjectType?.toLowerCase().includes(vertical.name.toLowerCase());
                        });
                        return (
                          <Card 
                            key={vertical.id}
                            className="cursor-pointer hover:border-purple-500 transition-colors"
                            onClick={() => setSelectedVertical(vertical.id)}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg">Vertical {romanNumerals[index]} - {vertical.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {verticalSubjects.length} subjects
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subject List View with Drag & Drop */}
              {(selectedSemester || selectedVertical || selectedElectiveCategory) && (
                <div className="space-y-2">
                  {filteredSubjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No subjects in this {selectedSemester ? 'semester' : selectedVertical ? 'vertical' : 'category'} yet.</p>
                      <p className="text-sm">Click "Add Subject" to create one.</p>
                    </div>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <div
                        key={subject._id}
                        draggable
                        onDragStart={() => handleDragStart(subject._id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(subject._id)}
                        className={`flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent cursor-move transition-colors ${
                          draggedSubjectId === subject._id ? 'opacity-50 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                            {(subject.displayOrder ?? 0) + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">{subject.code}</span>
                              <Badge className={getStatusColor(subject.status === "Sent to HOD" ? "Received" : subject.status)}>
                                {subject.status === "Sent to HOD" ? "Received" : subject.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{subject.title}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              <span>Faculty: {getFacultyNameById(subject.assignedFaculty) || "Not assigned"}</span>
                              <span>Expert: {getExpertNameById(subject.assignedExpert) || "Not assigned"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!subject.assignedFaculty && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignFaculty(subject._id);
                              }}
                            >
                              Assign Faculty
                            </Button>
                          )}
                          {!subject.assignedExpert && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignExpert(subject._id);
                              }}
                            >
                              Assign Expert
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSubject(subject);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubjectToDelete({ id: subject._id, title: subject.title });
                              setIsDeleteSubjectOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>

            {/* Add Subject Dialog */}
            <Dialog open={isAddSubjectOpen} onOpenChange={(open) => {
              setIsAddSubjectOpen(open);
              if (!open) setCourseCodeWarning("");
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedVertical 
                      ? `Add New Subject to Vertical ${romanNumerals[verticals.findIndex(v => v.id === selectedVertical)]} - ${verticals.find(v => v.id === selectedVertical)?.name}`
                      : `Add New Subject to Semester ${selectedSemester}`
                    }
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject-code">Course Code</Label>
                    <Input
                      id="subject-code"
                      value={newSubjectCode}
                      onChange={(e) => handleCourseCodeChange(e.target.value)}
                      placeholder="Enter course code (e.g., CS101)"
                    />
                    {courseCodeWarning && (
                      <p className={`text-sm mt-1 ${
                        courseCodeWarning.startsWith('ℹ️') ? 'text-green-600' : 'text-red-600'
                      }`}>{courseCodeWarning}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="subject-title">Course Title</Label>
                    <Input
                      id="subject-title"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Enter course title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-regulation">Regulation</Label>
                    <Select 
                      value={selectedRegulationForSubject || selectedRegulationId || ""} 
                      onValueChange={setSelectedRegulationForSubject}
                      disabled={!!selectedRegulationId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Regulation" />
                      </SelectTrigger>
                      <SelectContent>
                        {regulations.map((reg) => (
                          <SelectItem key={reg.regulationCode} value={reg.versions[0]?._id || reg.regulationCode}>
                            {reg.regulationCode} - {reg.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!selectedVertical && (
                    <>
                      <div>
                        <Label htmlFor="subject-semester">Semester</Label>
                        <Select 
                          value={selectedSemester?.toString() || ""} 
                          onValueChange={(val) => {}}
                          disabled={!!selectedSemester}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={selectedSemester ? `Semester ${selectedSemester}` : "Select Semester"} />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="course-type">Course Type</Label>
                        <Select 
                          value={courseType} 
                          onValueChange={setCourseType}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Course Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HSMC">Humanities & Social Science (HSMC)</SelectItem>
                            <SelectItem value="BSC">Basic Science (BSC)</SelectItem>
                            <SelectItem value="ESC">Engineering Science (ESC)</SelectItem>
                            <SelectItem value="PCC">Program Core (PCC)</SelectItem>
                            <SelectItem value="PEC">Professional Elective (PEC)</SelectItem>
                            <SelectItem value="OEC">Open Elective (OEC)</SelectItem>
                            <SelectItem value="EEC">Employability Enhancement (EEC)</SelectItem>
                            <SelectItem value="MC">Mandatory Courses (MC)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(courseType === 'OEC' || courseType === 'MC') && (
                        <div>
                          <Label htmlFor="elective-category">
                            {courseType === 'OEC' ? 'Open Electives Category' : 'Mandatory Course Category'}
                          </Label>
                          <Select 
                            value={subjectType} 
                            onValueChange={setSubjectType}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={`Select ${courseType === 'OEC' ? 'Open Electives' : 'Mandatory Course'}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={courseType === 'OEC' ? 'Open Electives - I' : 'Mandatory Course - I'}>
                                {courseType === 'OEC' ? 'Open Electives - I' : 'Mandatory Course - I'}
                              </SelectItem>
                              <SelectItem value={courseType === 'OEC' ? 'Open Electives - II' : 'Mandatory Course - II'}>
                                {courseType === 'OEC' ? 'Open Electives - II' : 'Mandatory Course - II'}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {courseType !== 'OEC' && courseType !== 'MC' && (
                        <div>
                          <Label htmlFor="subject-type">Subject Type</Label>
                          <Select 
                            value={subjectType} 
                            onValueChange={setSubjectType}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Subject Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Theory">Theory</SelectItem>
                              <SelectItem value="Practical">Practical</SelectItem>
                              <SelectItem value="T&P">T&P</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label>LTPC Code</Label>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label htmlFor="ltpc-l" className="text-xs">L</Label>
                            <Input
                              id="ltpc-l"
                              value={ltpcL}
                              onChange={(e) => setLtpcL(e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ltpc-t" className="text-xs">T</Label>
                            <Input
                              id="ltpc-t"
                              value={ltpcT}
                              onChange={(e) => setLtpcT(e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ltpc-p" className="text-xs">P</Label>
                            <Input
                              id="ltpc-p"
                              value={ltpcP}
                              onChange={(e) => setLtpcP(e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ltpc-c" className="text-xs">C</Label>
                            <Input
                              id="ltpc-c"
                              value={ltpcC}
                              onChange={(e) => setLtpcC(e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <Button onClick={handleAddSubject} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isAddingSubject}>
                    {isAddingSubject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAddingSubject ? "Adding..." : "Add Subject"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Subject Dialog */}
            <Dialog open={isEditSubjectOpen} onOpenChange={setIsEditSubjectOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-subject-code">Subject Code</Label>
                    <Input
                      id="edit-subject-code"
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      placeholder="Enter subject code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-subject-name">Subject Name</Label>
                    <Input
                      id="edit-subject-name"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Enter subject name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-faculty">Assigned Faculty</Label>
                    <Select value={selectedFaculty ?? ""} onValueChange={(val) => setSelectedFaculty(val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a faculty member" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyList.map((f) => (
                          <SelectItem key={f._id} value={f._id}>
                            {f.name} ({f.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-expert">Assigned Expert</Label>
                    <Select value={selectedExpert ?? ""} onValueChange={(val) => setSelectedExpert(val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a subject expert" />
                      </SelectTrigger>
                      <SelectContent>
                        {expertList.map((e) => (
                          <SelectItem key={e._id} value={e._id}>
                            {e.name} ({e.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleUpdateSubject} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isUpdatingSubject}>
                    {isUpdatingSubject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUpdatingSubject ? "Updating..." : "Update Subject"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Assign Faculty Dialog */}
            <Dialog open={isFacultyDialogOpen} onOpenChange={setIsFacultyDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Faculty</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Faculty</Label>
                    <Popover open={facultyPopoverOpen} onOpenChange={setFacultyPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={facultyPopoverOpen}
                          className="w-full justify-between"
                        >
                          {selectedFaculty
                            ? facultyList.find((f) => f._id === selectedFaculty)?.name + " (" + facultyList.find((f) => f._id === selectedFaculty)?.email + ")"
                            : "Choose a faculty member"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search faculty..." />
                          <CommandList>
                            <CommandEmpty>No faculty found.</CommandEmpty>
                            <CommandGroup>
                              {facultyList.map((f) => (
                                <CommandItem
                                  key={f._id}
                                  value={`${f.name} ${f.email}`}
                                  onSelect={() => {
                                    setSelectedFaculty(f._id)
                                    setFacultyPopoverOpen(false)
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedFaculty === f._id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {f.name} ({f.email})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={handleSaveFaculty} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSavingFaculty}>
                    {isSavingFaculty && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSavingFaculty ? "Assigning..." : "Assign Faculty"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>


            {/* Assign Expert Dialog */}
            <Dialog open={isExpertDialogOpen} onOpenChange={setIsExpertDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Subject Expert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Expert</Label>
                    <Popover open={expertPopoverOpen} onOpenChange={setExpertPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={expertPopoverOpen}
                          className="w-full justify-between"
                        >
                          {selectedExpert
                            ? expertList.find((e) => e._id === selectedExpert)?.name + " (" + expertList.find((e) => e._id === selectedExpert)?.email + ")"
                            : "Choose a subject expert"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search expert..." />
                          <CommandList>
                            <CommandEmpty>No expert found.</CommandEmpty>
                            <CommandGroup>
                              {expertList.map((e) => (
                                <CommandItem
                                  key={e._id}
                                  value={`${e.name} ${e.email}`}
                                  onSelect={() => {
                                    setSelectedExpert(e._id)
                                    setExpertPopoverOpen(false)
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedExpert === e._id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {e.name} ({e.email})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={handleSaveExpert} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSavingExpert}>
                    {isSavingExpert && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSavingExpert ? "Assigning..." : "Assign Expert"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Subject Confirmation Dialog */}
            <Dialog open={isDeleteSubjectOpen} onOpenChange={setIsDeleteSubjectOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Subject</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{subjectToDelete?.title}&quot;? This action cannot be undone. All associated data including syllabus files will be permanently removed, and notifications will be sent to assigned faculty and experts.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteSubjectOpen(false);
                      setSubjectToDelete(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSubject}
                    disabled={isDeletingSubject}
                  >
                    {isDeletingSubject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeletingSubject ? "Deleting..." : "Delete Subject"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Elective/Mandatory Subject Dialog */}
            <Dialog open={isAddElectiveSubjectOpen} onOpenChange={setIsAddElectiveSubjectOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Subject to {selectedElectiveCategory}</DialogTitle>
                  <DialogDescription>
                    Enter the subject details for {selectedElectiveCategory}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="elective-course-code">Course Code</Label>
                      <Input
                        id="elective-course-code"
                        value={electiveSubjectCode}
                        onChange={(e) => setElectiveSubjectCode(e.target.value)}
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="elective-course-title">Course Title</Label>
                      <Input
                        id="elective-course-title"
                        value={electiveSubjectTitle}
                        onChange={(e) => setElectiveSubjectTitle(e.target.value)}
                        placeholder="e.g., Introduction to Programming"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="elective-regulation-code">Regulation Code</Label>
                    <Input
                      id="elective-regulation-code"
                      value={electiveRegulationCode}
                      onChange={(e) => setElectiveRegulationCode(e.target.value)}
                      placeholder="e.g., R2021"
                      disabled
                    />
                  </div>
                  <div>
                    <Label>LTPC Code</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label htmlFor="elective-l" className="text-xs">L (Lecture)</Label>
                        <Input
                          id="elective-l"
                          value={electiveL}
                          onChange={(e) => setElectiveL(e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </div>
                      <div>
                        <Label htmlFor="elective-t" className="text-xs">T (Tutorial)</Label>
                        <Input
                          id="elective-t"
                          value={electiveT}
                          onChange={(e) => setElectiveT(e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </div>
                      <div>
                        <Label htmlFor="elective-p" className="text-xs">P (Practical)</Label>
                        <Input
                          id="elective-p"
                          value={electiveP}
                          onChange={(e) => setElectiveP(e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </div>
                      <div>
                        <Label htmlFor="elective-c" className="text-xs">C (Credits)</Label>
                        <Input
                          id="elective-c"
                          value={electiveC}
                          onChange={(e) => setElectiveC(e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={async () => {
                      if (!electiveSubjectCode || !electiveSubjectTitle) {
                        toast.error("Please fill in all required fields");
                        return;
                      }
                      
                      setIsAddingElectiveSubject(true);
                      try {
                        const token = localStorage.getItem("token");
                        const courseTypeValue = selectedElectiveCategory?.includes('Open Electives') ? 'OEC' : 'MC';
                        
                        const response = await fetch("http://localhost:5000/api/auth/add-subject", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            code: electiveSubjectCode,
                            title: electiveSubjectTitle,
                            semester: null,
                            regulationId: selectedRegulationId,
                            regulationCode: selectedRegulation?.regulationCode || "",
                            courseType: courseTypeValue,
                            subjectType: selectedElectiveCategory,
                            ltpcCode: `${electiveL}-${electiveT}-${electiveP}-${electiveC}`,
                            department: user.department,
                            displayOrder: 0,
                            assignedFaculty: "",
                            assignedExpert: "",
                            createdBy: user._id,
                          }),
                        });

                        if (!response.ok) {
                          let errorMessage = "Failed to add subject";
                          try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorMessage;
                          } catch (parseError) {
                            // If JSON parsing fails, use status text
                            errorMessage = `Server error: ${response.status} ${response.statusText}`;
                          }
                          throw new Error(errorMessage);
                        }

                        const newSubject = await response.json();
                        setSubjects((prev) => [...prev, newSubject]);
                        
                        setElectiveSubjectCode("");
                        setElectiveSubjectTitle("");
                        setElectiveL("");
                        setElectiveT("");
                        setElectiveP("");
                        setElectiveC("");
                        setIsAddElectiveSubjectOpen(false);
                        
                        toast.success("Subject added successfully!");
                      } catch (error: any) {
                        console.error("Error adding subject:", error);
                        toast.error(error.message || "Failed to add subject");
                      } finally {
                        setIsAddingElectiveSubject(false);
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isAddingElectiveSubject}
                  >
                    {isAddingElectiveSubject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAddingElectiveSubject ? "Adding..." : "Add Subject"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Update Title Confirmation Dialog */}
            <AlertDialog open={isUpdateTitleDialogOpen} onOpenChange={setIsUpdateTitleDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update Course Title?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You&apos;ve changed the title from &quot;{titleUpdateInfo?.oldTitle}&quot; to &quot;{titleUpdateInfo?.newTitle}&quot;.
                    <br /><br />
                    This will update the title for all subjects with course code &quot;{titleUpdateInfo?.courseCode}&quot; across all departments in this regulation.
                    <br /><br />
                    Do you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleCancelTitleUpdate}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmTitleUpdate} className="bg-purple-600 hover:bg-purple-700">
                    Update All Titles
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Create Vertical Dialog */}
            <Dialog open={isCreateVerticalDialogOpen} onOpenChange={setIsCreateVerticalDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Vertical</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new vertical course category
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vertical-name">Vertical Name</Label>
                    <Input
                      id="vertical-name"
                      value={newVerticalName}
                      onChange={(e) => setNewVerticalName(e.target.value)}
                      placeholder="e.g., AI & ML, Data Science, Cybersecurity"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleConfirmCreateVertical();
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateVerticalDialogOpen(false);
                        setNewVerticalName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleConfirmCreateVertical}
                      disabled={isCreatingVertical}
                    >
                      {isCreatingVertical && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isCreatingVertical ? "Creating..." : "Create Vertical"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </Card>
        )

      case "tracker":
        const filteredTrackerSubjects = subjects.filter((subject) => {
          // Filter by regulation
          if (trackerRegulationFilter && trackerRegulationFilter !== "all") {
            const subjectRegulationId = 
              typeof subject.regulationId === "string"
                ? subject.regulationId
                : subject.regulationId?._id || subject.regulationId?.toString();
            
            const matchingRegulation = regulations.find(
              (reg) => reg.versions[0]?._id === subjectRegulationId
            );
            
            if (!matchingRegulation || matchingRegulation.regulationCode !== trackerRegulationFilter) {
              return false;
            }
          }

          // Filter by semester
          if (trackerSemesterFilter && trackerSemesterFilter !== "all") {
            if (subject.semester?.toString() !== trackerSemesterFilter) {
              return false;
            }
          }

          // Filter by status
          if (trackerStatusFilter && trackerStatusFilter !== "all") {
            if (subject.status !== trackerStatusFilter) {
              return false;
            }
          }

          // Filter by expert
          if (trackerExpertFilter && trackerExpertFilter !== "all") {
            if (getExpertNameById(subject.assignedExpert) !== trackerExpertFilter) {
              return false;
            }
          }

          return true;
        });

        return (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Syllabus Tracker
              </CardTitle>
              <CardDescription>Track the status of syllabi created by you</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="tracker-regulation-filter">Filter by Regulation</Label>
                  <Select
                    value={trackerRegulationFilter}
                    onValueChange={setTrackerRegulationFilter}
                  >
                    <SelectTrigger id="tracker-regulation-filter">
                      <SelectValue placeholder="All Regulations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regulations</SelectItem>
                      {regulations.map((reg) => (
                        <SelectItem key={reg.regulationCode} value={reg.regulationCode}>
                          {reg.regulationCode} - {reg.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tracker-semester-filter">Filter by Semester</Label>
                  <Select
                    value={trackerSemesterFilter}
                    onValueChange={setTrackerSemesterFilter}
                  >
                    <SelectTrigger id="tracker-semester-filter">
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tracker-status-filter">Filter by Status</Label>
                  <Select
                    value={trackerStatusFilter}
                    onValueChange={setTrackerStatusFilter}
                  >
                    <SelectTrigger id="tracker-status-filter">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent to HOD">Sent to HOD</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tracker-expert-filter">Filter by Expert</Label>
                  <Select
                    value={trackerExpertFilter}
                    onValueChange={setTrackerExpertFilter}
                  >
                    <SelectTrigger id="tracker-expert-filter">
                      <SelectValue placeholder="All Experts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Experts</SelectItem>
                      {Array.from(new Set(subjects.map(s => getExpertNameById(s.assignedExpert)).filter(Boolean))).map((expert) => (
                        <SelectItem key={expert} value={expert as string}>{expert}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(trackerRegulationFilter !== "all" || trackerSemesterFilter !== "all" || trackerStatusFilter !== "all" || trackerExpertFilter !== "all") && (
                <div className="mb-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTrackerRegulationFilter("all");
                      setTrackerSemesterFilter("all");
                      setTrackerStatusFilter("all");
                      setTrackerExpertFilter("all");
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Regulation</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Expert</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrackerSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No subjects found matching the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTrackerSubjects
                        .sort((a, b) => {
                          // Sort by lastUpdated in descending order (newest first)
                          const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                          const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                          return dateB - dateA;
                        })
                        .map((subject) => {
                        const subjectRegulationId = 
                          typeof subject.regulationId === "string"
                            ? subject.regulationId
                            : subject.regulationId?._id || subject.regulationId?.toString();
                        
                        const regulation = regulations.find(
                          (reg) => reg.versions[0]?._id === subjectRegulationId
                        );

                        return (
                          <TableRow key={subject._id} className="hover:bg-muted">
                            <TableCell className="font-mono text-sm">{subject.code}</TableCell>
                            <TableCell className="font-medium">{subject.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {regulation?.regulationCode || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                Sem {subject.semester || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getExpertNameById(subject.assignedExpert) || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(subject.status === "Sent to HOD" ? "Received" : subject.status)}>
                                {subject.status === "Sent to HOD" ? "Received" : subject.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {subject.lastUpdated
                                ? new Date(subject.lastUpdated).toLocaleString()
                                : "Not Updated"}
                            </TableCell>
                            <TableCell className="flex flex-wrap gap-2">
                        {subject.syllabusUrl && (
                          <a
                            href={`http://localhost:5000/api/auth/file/${subject.syllabusUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </a>
                        )}

                        {subject.status === "Sent to HOD" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setApproveSubjectId(subject._id)}
                              disabled={isApprovingSubject === subject._id}
                            >
                              {isApprovingSubject === subject._id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isApprovingSubject === subject._id ? "Approving..." : "Approve"}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectSubjectId(subject._id)}
                              disabled={isRejectingSubject === subject._id}
                            >
                              {isRejectingSubject === subject._id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isRejectingSubject === subject._id ? "Rejecting..." : "Reject"}
                            </Button>
                          </>
                        )}

                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );



      case "curriculum":
        return (
          <CreateCurriculum
            user={user}
            selectedRegulation={selectedRegulationDetail}
            onDraftSaved={() => {
              fetchRegulations();
              setHasUnsavedCurriculumChanges(false);
            }}
            onSubmitted={() => {
              fetchRegulations();
              setHasUnsavedCurriculumChanges(false);
            }}
            resetSignal={formResetSignal}
            onFormChange={() => setHasUnsavedCurriculumChanges(true)}
          />
        )

      case "regulations":
        return (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Regulation Library</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  View every submission saved under your department and jump back into any version.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleStartFreshRegulation}>
                  Start Fresh Regulation
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchRegulations}
                  disabled={regulationsLoading}
                >
                  {regulationsLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {regulationsError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
                {regulationsError}
              </div>
            )}

            {regulationsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading regulations...
              </div>
            ) : regulations.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No regulations yet</CardTitle>
                  <CardDescription>
                    Create your first curriculum draft from the Curriculum Creation tab to see it listed here.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-4">
                {regulations.map((reg) => (
                  <Card key={`${reg.regulationCode}-${reg.department}`} className="hover-lift">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <button
                          className="text-left"
                          onClick={() => reg.versions[0]?._id && handleSelectRegulationVersion(reg.versions[0]._id)}
                        >
                          <CardTitle>
                            {reg.regulationCode} • {reg.department}
                          </CardTitle>
                          <CardDescription>
                            Last updated {formatDate(reg.lastUpdated)}
                          </CardDescription>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{`v${reg.latestVersion}`}</Badge>
                        <Badge className={getStatusColor(reg.latestStatus)}>{reg.latestStatus}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRegulationToRename(reg);
                            setRenameValue(reg.regulationCode);
                            setIsRenameDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRegulationToDelete(reg);
                            setIsDeleteRegulationOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">Version history</p>
                      <div className="flex flex-wrap gap-3">
                        {reg.versions.map((version) => {
                          const savedByNote = describeSavedBy(version.savedBy);
                          return (
                            <div key={version._id} className="flex items-start gap-2 min-w-[190px]">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant={
                                    selectedRegulationDetail?._id === version._id ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() => handleSelectRegulationVersion(version._id)}
                                  disabled={loadingVersionId === version._id}
                                  className="flex items-center gap-2"
                                >
                                  v{version.version}
                                  <span
                                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(
                                      version.isDraft ? "Draft" : version.status
                                    )}`}
                                  >
                                    {version.isDraft ? "Draft" : version.status}
                                  </span>
                                  {version.isLatest && (
                                    <span className="text-[11px] font-semibold text-purple-600">
                                      Current
                                    </span>
                                  )}
                                  {loadingVersionId === version._id && (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  )}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                  {formatSavedMeta(version.savedAt, version.isLatest, version.isDraft)}
                                  {savedByNote && ` • ${savedByNote}`}
                                </p>
                              </div>
                              {version.curriculumUrl && (
                                <a
                                  href={`http://localhost:5000/api/auth/file/${version.curriculumUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="icon">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Delete Regulation Confirmation Dialog */}
            <AlertDialog open={isDeleteRegulationOpen} onOpenChange={setIsDeleteRegulationOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Regulation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete regulation{" "}
                    <span className="font-semibold">{regulationToDelete?.regulationCode}</span>?
                    This will permanently delete all versions and associated curriculum files. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteRegulation}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeletingRegulation}
                  >
                    {isDeletingRegulation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeletingRegulation ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* New Regulation Name Dialog */}
            <Dialog open={isRegulationNameDialogOpen} onOpenChange={setIsRegulationNameDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Regulation</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new regulation (e.g., R2022, R2023)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="regulation-name">Regulation Name</Label>
                    <Input
                      id="regulation-name"
                      value={newRegulationName}
                      onChange={(e) => setNewRegulationName(e.target.value)}
                      placeholder="e.g., R2022"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isCreatingRegulation) {
                          handleCreateNewRegulation();
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Department: <span className="font-medium">{user.department || "Not set"}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRegulationNameDialogOpen(false)}
                      disabled={isCreatingRegulation}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateNewRegulation}
                      disabled={isCreatingRegulation}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isCreatingRegulation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Regulation"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Rename Regulation Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Regulation</DialogTitle>
                  <DialogDescription>
                    Enter a new name for the regulation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rename-regulation">New Regulation Name</Label>
                    <Input
                      id="rename-regulation"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder="e.g., R2023"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isRenamingRegulation) {
                          handleRenameRegulation();
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current name: <span className="font-medium">{regulationToRename?.regulationCode}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRenameDialogOpen(false);
                        setRegulationToRename(null);
                        setRenameValue("");
                      }}
                      disabled={isRenamingRegulation}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRenameRegulation}
                      disabled={isRenamingRegulation}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isRenamingRegulation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Renaming...
                        </>
                      ) : (
                        "Rename"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )

      default:
        return <div>Content for {activeTab}</div>
    }
  }

  return (
    <>
      <DashboardLayout user={user} activeTab={activeTab} onTabChange={handleTabChange}>
        {renderContent()}
      </DashboardLayout>

      {/* Leave Curriculum Confirmation Dialog */}
      <AlertDialog open={isLeaveCurriculumDialogOpen} onOpenChange={setIsLeaveCurriculumDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You may lose changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the curriculum form. Do you want to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLeaveWithoutSaving}>Leave</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndLeave}>Save Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Subject Confirmation Dialog */}
      <AlertDialog open={approveSubjectId !== null} onOpenChange={(open) => !open && setApproveSubjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Syllabus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this syllabus? This will mark it as approved and notify the faculty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (approveSubjectId) {
                  handleApprove(approveSubjectId);
                  setApproveSubjectId(null);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Subject Confirmation Dialog */}
      <AlertDialog open={rejectSubjectId !== null} onOpenChange={(open) => !open && setRejectSubjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Syllabus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this syllabus? The faculty will be notified and asked to revise it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectSubjectId) {
                  handleReject(rejectSubjectId);
                  setRejectSubjectId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

