"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, FileText, MessageSquare, Download, Send, Eye, Upload, FileUp, Book, BookOpen } from "lucide-react"
import DashboardLayout from "./dashboard-layout"
import CreateSyllabus from "./syllabus/create-syllabus"

interface User {
  _id: string
  email: string
  role: string
  name: string
}

interface FacultyDashboardProps {
  user: User
}

interface SyllabusDraft {
  id: string,
  subjectId: string
  subject: string
  status: string
  lastUpdated: string
  feedback?: string
  expertName?: string
  draftFile?: File | null
  regulationId?: string | { _id: string; regulationCode?: string } | any
  semester?: number
}

interface Unit {
  name: string
  hours: string
  content: string
}

interface FormFields {
  objectives: string
  courseDescription: string
  prerequisites: string
  units: Unit[]
  theoryPeriods: string
  practicalExercises: string
  practicalPeriods: string
  totalPeriods: string
  courseFormat: string
  assessments: string
  CO1: string
  CO2: string
  CO3: string
  CO4: string
  CO5: string
  textBooks: string
  references: string
  L: string
  T: string
  P: string
  C: string
}

export default function FacultyDashboard({ user }: FacultyDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAddDraftOpen, setIsAddDraftOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<"approved" | "upload" | "manual">("approved")
  const [showManualInput, setShowManualInput] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [regulationFilter, setRegulationFilter] = useState<string>("all")
  const [semesterFilter, setSemesterFilter] = useState<string>("all")
  const [syllabusDrafts, setSyllabusDrafts] = useState<SyllabusDraft[]>([]);
  const router = useRouter();




  const [formFields, setFormFields] = useState<FormFields>({
    objectives: "",
    courseDescription: "",
    prerequisites: "",
    units: Array.from({ length: 5 }, () => ({ name: "", hours: "", content: "" })),
    theoryPeriods: "",
    practicalExercises: "",
    practicalPeriods: "",
    totalPeriods: "",
    courseFormat: "",
    assessments: "",
    CO1: "",
    CO2: "",
    CO3: "",
    CO4: "",
    CO5: "",
    textBooks: "",
    references: "",
    L: "",
    T: "",
    P: "",
    C: "",
  })


  const fetchSubjects = async () => {
    const res = await fetch(`https://csms-x9aw.onrender.com/api/auth/faculty-subjects/${user._id}`);
    const data = await res.json();

    const formatted = data.map((subject: any, idx: number) => ({
      id: idx + 1,
      subjectId: subject._id,
      subject: subject.title,
      expertName: subject.assignedExpert.name,
      draftFile: subject.syllabusUrl,
      status: subject.status,
      lastUpdated: subject.updatedAt,
      feedback: subject.feedback || "",
    }));

    setSyllabusDrafts(formatted);
  };

  useEffect(() => {
    fetchSubjects();
  }, [user._id]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-red-100 text-red-800"
    }
  }


const handleSendToExpert = async (subjectId: string, file: File) => {
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("https://csms-x9aw.onrender.com/api/auth/upload", {
      method: "POST",
      body: formData,
    });

    const { fileId } = await uploadRes.json();
    console.log("Uploaded file ID:", fileId);

    await fetch("https://csms-x9aw.onrender.com/api/auth/faculty-upload", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        fileId,
      }),
    });

    // Refresh the subject state
    fetchSubjects();
  } catch (err) {
    console.error("Upload failed", err);
  }
};

const handleSendToHOD = async (subjectId: string, file: File) => {
  try {
    // Upload the file first
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("https://csms-x9aw.onrender.com/api/auth/upload", {
      method: "POST",
      body: formData,
    });

    const { fileId } = await uploadRes.json();
    console.log("Uploaded file ID:", fileId);


    if (!fileId) throw new Error("File upload failed");

    // Link file to course and update status
    const res = await fetch("https://csms-x9aw.onrender.com/api/auth/send-to-hod", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, fileId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to send");

    // Refresh drafts or notify user
    fetchSubjects(); // <- Your function to refresh the data
  } catch (error) {
    console.error("Send to HOD failed:", error);
    alert("Failed to send to HOD: " + error);
  }
};




  const handleApprovedSubjectSelect = (subjectName: string) => {
    setTitle(subjectName)
    setSubject(subjectName.replace(/\s+/g, "").substring(0, 2).toUpperCase() + "101")
    setFormFields({
      objectives: `To understand the principles and concepts of ${subjectName}...`,
      courseDescription: `This course covers the fundamental aspects of ${subjectName}...`,
      prerequisites: "Basic programming knowledge",
      units: Array.from({ length: 5 }, (_, i) => ({
        name: `Unit ${i + 1}: ${subjectName} Topic ${i + 1}`,
        hours: `${8 + i}`,
        content: `Content for ${subjectName} Unit ${i + 1}...`,
      })),
      theoryPeriods: "45",
      practicalExercises: `Lab exercises related to ${subjectName}`,
      practicalPeriods: "15",
      totalPeriods: "60",
      courseFormat: "Lecture, Lab, Group Work",
      assessments: "Internal Assessment: 40%\nEnd Semester Exam: 60%",
      CO1: `Understand the basic concepts of ${subjectName}`,
      CO2: `Apply the principles of ${subjectName} to solve problems`,
      CO3: `Analyze various ${subjectName} techniques`,
      CO4: `Design and implement ${subjectName} solutions`,
      CO5: `Evaluate and compare different ${subjectName} approaches`,
      textBooks: `1. Introduction to ${subjectName} by Author A\n2. Advanced ${subjectName} by Author B`,
      references: `1. ${subjectName} Handbook by Author C\n2. Modern ${subjectName} by Author D`,
      L: "3",
      T: "1",
      P: "2",
      C: "4",
    })
    setShowManualInput(true)
  }

  const handleUploadFileExtraction = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setTitle("Extracted Course Title")
      setSubject("CS101")
      setFormFields({
        objectives: "Extracted objectives from uploaded file...",
        courseDescription: "Extracted course description from uploaded file...",
        prerequisites: "Extracted prerequisites from uploaded file...",
        units: Array.from({ length: 5 }, (_, i) => ({
          name: `Extracted Unit ${i + 1}`,
          hours: `${8 + i}`,
          content: `Extracted content for Unit ${i + 1}...`,
        })),
        theoryPeriods: "45",
        practicalExercises: "Extracted practical exercises...",
        practicalPeriods: "15",
        totalPeriods: "60",
        courseFormat: "Extracted course format...",
        assessments: "Extracted assessment methods...",
        CO1: "Extracted course outcome 1...",
        CO2: "Extracted course outcome 2...",
        CO3: "Extracted course outcome 3...",
        CO4: "Extracted course outcome 4...",
        CO5: "Extracted course outcome 5...",
        textBooks: "Extracted textbooks...",
        references: "Extracted references...",
        L: "3",
        T: "1",
        P: "2",
        C: "4",
      })
      setShowManualInput(true)
    }
  }

  const handleGenerateDocument = () => {
    if (!validateFormFields()) {
      alert("Please fill all required fields.")
      return
    }

    setIsGenerating(true)

    setTimeout(() => {
      setIsGenerating(false)
      alert("PDF generated and downloaded successfully!")

      setShowManualInput(false)
      setTitle("")
      setSubject("")
      setFormFields({
        objectives: "",
        courseDescription: "",
        prerequisites: "",
        units: Array.from({ length: 5 }, () => ({ name: "", hours: "", content: "" })),
        theoryPeriods: "",
        practicalExercises: "",
        practicalPeriods: "",
        totalPeriods: "",
        courseFormat: "",
        assessments: "",
        CO1: "",
        CO2: "",
        CO3: "",
        CO4: "",
        CO5: "",
        textBooks: "",
        references: "",
        L: "",
        T: "",
        P: "",
        C: "",
      })
    }, 2000)
  }

  const validateFormFields = () => {
    const requiredFields = [
      formFields.objectives,
      formFields.courseDescription,
      formFields.theoryPeriods,
      formFields.practicalExercises,
      formFields.practicalPeriods,
      formFields.totalPeriods,
      formFields.CO1,
      formFields.CO2,
      formFields.CO3,
      formFields.CO4,
      formFields.CO5,
      formFields.textBooks,
      formFields.references,
      formFields.L,
      formFields.T,
      formFields.P,
      formFields.C,
    ].every((field) => field.trim() !== "")

    const allUnitsFilled = formFields.units.every(
      (unit) => unit.name.trim() !== "" && unit.hours.trim() !== "" && unit.content.trim() !== "",
    )

    return requiredFields && allUnitsFilled && title && subject
  }


  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{syllabusDrafts.length}</div>
                  <p className="text-xs text-muted-foreground">Total drafts</p>
                </CardContent>
              </Card>


              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sent to HOD</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {syllabusDrafts.filter((draft) => draft.status === "Sent to HOD").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Completed formatting</p>
                </CardContent>
              </Card>
            </div>

            

          </div>
        )

      case "drafts":
        return (
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Syllabus Approval
                  </CardTitle>
                  <CardDescription>Manage your syllabus drafts, feedback, and approvals from the expert</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="regulation-filter">Filter by Regulation</Label>
                  <Select
                    value={regulationFilter}
                    onValueChange={setRegulationFilter}
                  >
                    <SelectTrigger id="regulation-filter">
                      <SelectValue placeholder="All Regulations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regulations</SelectItem>
                      {Array.from(new Set(syllabusDrafts.map(d => {
                        const regId = typeof d.regulationId === "string" 
                          ? d.regulationId 
                          : d.regulationId?._id || d.regulationId?.toString();
                        return regId;
                      }).filter(Boolean))).map((regId) => (
                        <SelectItem key={regId} value={regId as string}>{regId}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="semester-filter">Filter by Semester</Label>
                  <Select
                    value={semesterFilter}
                    onValueChange={setSemesterFilter}
                  >
                    <SelectTrigger id="semester-filter">
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(regulationFilter !== "all" || semesterFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRegulationFilter("all");
                      setSemesterFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Expert</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syllabusDrafts
                    .filter((draft) => {
                      if (regulationFilter && regulationFilter !== "all") {
                        const draftRegId = typeof draft.regulationId === "string" 
                          ? draft.regulationId 
                          : draft.regulationId?._id || draft.regulationId?.toString();
                        if (draftRegId !== regulationFilter) return false;
                      }
                      if (semesterFilter && semesterFilter !== "all") {
                        if (draft.semester?.toString() !== semesterFilter) return false;
                      }
                      return true;
                    })
                    .map((draft) => (
                    <TableRow key={draft.id} className="hover:bg-muted">
                      <TableCell className="font-medium">{draft.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeof draft.regulationId === "string" 
                            ? draft.regulationId 
                            : draft.regulationId?.regulationCode || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Sem {draft.semester || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(draft.status)}>{draft.status !== "Approved"? "Not Approved yet" : draft.status}</Badge>
                      </TableCell>
                      <TableCell>{draft.lastUpdated}</TableCell>
                      <TableCell>
                        {draft.expertName && (
                          <div className="text-sm">
                            <p className="font-medium">{draft.expertName}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {draft.status === "Approved" && draft.draftFile && (
                              <a
                                href={`https://csms-x9aw.onrender.com/api/auth/file/${draft.draftFile}`}
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
                        </div>

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Dialog open={isAddDraftOpen} onOpenChange={setIsAddDraftOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Draft</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject-name">Course Name</Label>
                      <Input
                        id="subject-name"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="Enter course name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="draft-file">Upload Draft File</Label>
                      <Input
                        id="draft-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        // onChange={handleFileUpload}
                        className="mt-1"
                      />
                    </div>
                    {draftFile && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-sm text-purple-800">File selected: {draftFile.name}</p>
                      </div>
                    )}
                    <Button
                      // onClick={handleAddDraft}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!newSubjectName || !draftFile}
                    >
                      Add Draft
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )


      default:
        return <div>Content for {activeTab}</div>
    }
  }

  return (
    <DashboardLayout user={user} activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}

