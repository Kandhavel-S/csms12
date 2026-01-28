"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, CheckCircle, MessageSquare, Download, Upload } from "lucide-react"
import DashboardLayout from "./dashboard-layout"
import CreateSyllabus from "./syllabus/create-syllabus"
import toast from "react-hot-toast"


interface User {
  _id: string
  email: string
  role: string
  name: string
}

interface SubjectItem {
  _id: string
  code: string
  title: string
  assignedFaculty: string
  facultyName: string
  hodName?: string
  department?: string
  lastUpdated?: string
  status: string
  syllabusFile?: string
  regulationId?: string | { _id: string; regulationCode?: string } | any
  regulationCode?: string
  semester?: number
}

interface SubjectExpertDashboardProps {
  user: User
}

export default function SubjectExpertDashboard({ user }: SubjectExpertDashboardProps) {
  const [activeTab, setActiveTab] = useState("review")
  const [feedback, setFeedback] = useState("")
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string | null>(null)
  const [regulationFilter, setRegulationFilter] = useState<string>("all")
  const [semesterFilter, setSemesterFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [reviews, setReviews] = useState<SubjectItem[]>([])

  const fetchAssignedSubjects = async () => {
      try {
        const res = await fetch(`https://csms-x9aw.onrender.com/api/auth/expert-subjects/${user._id}`)
        const data = await res.json()
        
        // Check if data is an array before mapping
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data)
          setReviews([])
          return
        }
        
        const formattedSubjects = data.map((item: any, idx: number) => ({
          _id: item._id,
          code: item.code,
          title: item.title,
          assignedFaculty: item.assignedFaculty,
          facultyName: item.facultyName,
          hodName: item.hodName,
          department: item.department,
          lastUpdated: item.lastUpdated,
          status: item.status,
          syllabusFile: item.syllabusUrl,
          semester: item.semester,
          regulationId: item.regulationId,
          regulationCode: item.regulationCode,
        }));

        setReviews(formattedSubjects)
        console.log(formattedSubjects)
      } catch (err) {
        console.error("Failed to load courses", err)
        setReviews([])
      }
    }

  useEffect(() => {
    fetchAssignedSubjects()
  }, [user._id])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-200 text-yellow-700"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Sent to HOD":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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

    // Link file to course and update status (regulationId and department are already in the course record)
    const res = await fetch("https://csms-x9aw.onrender.com/api/auth/send-to-hod", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, fileId }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to send");

    // Refresh drafts or notify user
    fetchAssignedSubjects();
    toast.success("Successfully sent to HOD");
  } catch (error) {
    console.error("Send to HOD failed:", error);
    toast.error("Failed to send to HOD: " + error);
  }
};


  const handleApprove = async (subjectId: string) => {
    try {
      await fetch(`https://csms-x9aw.onrender.com/api/auth/subject/${subjectId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      setReviews((prev) =>
        prev.map((s) => s._id === subjectId ? { ...s, status: "Approved", lastUpdated: new Date().toISOString() } : s)
      )
    } catch (err) {
      console.error("Approve error:", err)
    }
  }

  const handleSendFeedback = async () => {
    if (!feedback.trim() || !selectedSyllabusId) return
    try {
      await fetch(`https://csms-x9aw.onrender.com/api/auth/subject/${selectedSyllabusId}/feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      })
      setReviews((prev) =>
        prev.map((s) => s._id === selectedSyllabusId
          ? { ...s, status: "Rejected", lastUpdated: new Date().toISOString() }
          : s)
      )
      setFeedback("")
      setSelectedSyllabusId(null)
    } catch (err) {
      console.error("Feedback error:", err)
    }
  }


const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle>Assigned Courses</CardTitle>
                  <CardDescription>Courses you've been assigned</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">{reviews.length}</CardContent>
              </Card>



              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle>Approved</CardTitle>
                  <CardDescription>Successfully validated syllabi</CardDescription>
                </CardHeader>
                <CardContent className="text-3xl font-bold">
                  {reviews.filter((s) => s.status === "Sent to HOD" || s.status === "Approved").length}
                </CardContent>
              </Card>

            </div>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Syllabi Activity
                </CardTitle>
                <CardDescription>Latest syllabus submissions and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews
                  .filter((s) => !!s.lastUpdated)
                  .sort((a, b) => new Date(b.lastUpdated!).getTime() - new Date(a.lastUpdated!).getTime())
                  .slice(0, 3)
                  .map((item) => (
                    <div key={item._id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title} syllabus</p>
                        <p className="text-xs text-muted-foreground">
                          by {item.facultyName} • {new Date(item.lastUpdated!).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </>
        )


      case "review":
        return (
          <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Assigned Courses
          </CardTitle>
          <CardDescription>Review and respond to submitted syllabus files</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
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
                  {Array.from(new Set(reviews.map(r => r.regulationCode).filter(Boolean))).map((regCode) => (
                    <SelectItem key={regCode} value={regCode as string}>{regCode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
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

            <div>
              <Label htmlFor="department-filter">Filter by Department</Label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger id="department-filter">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(reviews.map(r => r.department).filter(Boolean))).map((dept) => (
                    <SelectItem key={dept} value={dept as string}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter">
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
          </div>

          {(regulationFilter !== "all" || semesterFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all") && (
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRegulationFilter("all");
                  setSemesterFilter("all");
                  setDepartmentFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Regulation</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>HOD</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews
                .filter((review) => {
                  if (regulationFilter && regulationFilter !== "all") {
                    if (review.regulationCode !== regulationFilter) return false;
                  }
                  if (semesterFilter && semesterFilter !== "all") {
                    if (review.semester?.toString() !== semesterFilter) return false;
                  }
                  if (departmentFilter && departmentFilter !== "all") {
                    if (review.department !== departmentFilter) return false;
                  }
                  if (statusFilter && statusFilter !== "all") {
                    if (review.status !== statusFilter) return false;
                  }
                  return true;
                })
                .sort((a, b) => {
                  // Sort by lastUpdated in descending order (newest first)
                  const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                  const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                  return dateB - dateA;
                })
                .map((review) => (
                <TableRow key={review._id}>
                  <TableCell className="font-mono text-sm">{review.code}</TableCell>
                  <TableCell onClick={() => setActiveTab("create-draft")}>{review.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {review.regulationCode || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      Sem {review.semester || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {review.department || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{review.hodName || "N/A"}</TableCell>
                  <TableCell>{review.lastUpdated ? new Date(review.lastUpdated).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                          <input
                            type="file"
                            id={`upload-hod-${review._id}`}
                            accept=".docx,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setReviews((prev) =>
                                prev.map((d) =>
                                  d._id === review._id ? { ...d, draftFile: file } : d
                                )
                              );
                              // Automatically upload file to HOD after selection
                              handleSendToHOD(review._id, file);
                            }}
                          />

                          {review.status !== "Approved" && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() =>
                                document.getElementById(`upload-hod-${review._id}`)?.click()
                              }
                            >
                              <Upload className="mr-1 h-3 w-3" />
                              Send to HOD
                            </Button>
                          )}
                        </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        )

      case "create-draft":
        return <CreateSyllabus />

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