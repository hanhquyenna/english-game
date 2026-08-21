"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FolderPlus, FilePlus, Folder, FileText, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CefrBadge } from "@/components/teacher/badges";
import { EmptyState } from "@/components/teacher/empty-state";
import { PageHeader } from "@/components/teacher/page-header";

import { createMaterial, createMaterialFolder } from "@/lib/actions/materials";

export type MaterialFolderData = {
  id: string;
  name: string;
  count: number;
};

export type MaterialData = {
  id: string;
  folderId: string | null;
  title: string;
  fileType: string;
  fileUrl: string;
  topicTitle: string | null;
  cefrLevel: string;
  createdAt: string;
};

export function MaterialsClient({
  teacherId,
  classId,
  folders,
  materials,
  topics,
}: {
  teacherId: string;
  classId: string;
  folders: MaterialFolderData[];
  materials: MaterialData[];
  topics: { id: string; title: string }[];
}) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const [folderName, setFolderName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newFileType, setNewFileType] = useState("pdf");
  const [newTopicId, setNewTopicId] = useState("");
  const [newCefr, setNewCefr] = useState("B1");

  const [folderOpen, setFolderOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [pending, start] = useTransition();

  const filteredMaterials = materials.filter((m) => {
    if (selectedFolder && m.folderId !== selectedFolder) return false;
    if (levelFilter !== "all" && m.cefrLevel !== levelFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        await createMaterialFolder({ classId, name: folderName });
        toast.success(`Đã tạo thư mục "${folderName}"`);
        setFolderName("");
        setFolderOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tạo thất bại");
      }
    });
  }

  function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        await createMaterial({
          classId,
          folderId: selectedFolder,
          title: newTitle,
          fileType: newFileType,
          fileUrl: "#",
          topicId: newTopicId || null,
          cefrLevel: newCefr,
        });
        toast.success(`Đã tải lên "${newTitle}"`);
        setNewTitle("");
        setMaterialOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tải lên thất bại");
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thư viện học liệu"
        description="Quản lý tài liệu giảng dạy, phân loại theo chủ đề và trình độ CEFR."
        action={
          <>
          {/* New Folder Modal */}
          <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
            <DialogTrigger>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FolderPlus size={15} /> Tạo thư mục
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo thư mục mới</DialogTitle>
                <DialogDescription>
                  Đặt tên cho thư mục học liệu mới trong lớp.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="folder-name">Tên thư mục</Label>
                  <Input
                    id="folder-name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="VD: Tài liệu đọc hiểu B1"
                  />
                </div>
                <Button type="submit" disabled={pending || !folderName.trim()} className="w-full">
                  Tạo thư mục
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Upload Material Modal */}
          <Dialog open={materialOpen} onOpenChange={setMaterialOpen}>
            <DialogTrigger>
              <Button size="sm" className="gap-1.5 bg-[var(--persona)] text-white hover:opacity-90">
                <FilePlus size={15} /> Tải lên tài liệu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tải lên học liệu mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin và gắn thẻ bài học, trình độ CEFR thủ công.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMaterial} className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="mat-title">Tiêu đề tài liệu</Label>
                  <Input
                    id="mat-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Bài đọc B2 - Environment"
                  />
                </div>
                <div>
                  <Label htmlFor="mat-type">Loại tài liệu</Label>
                  <Select value={newFileType} onValueChange={(v) => v && setNewFileType(v)}>
                    <SelectTrigger id="mat-type" className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">Tài liệu PDF</SelectItem>
                      <SelectItem value="audio">File Âm thanh (Audio)</SelectItem>
                      <SelectItem value="doc">Văn bản Word / Doc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mat-topic">Bài học liên quan (tùy chọn)</Label>
                  <Select
                    value={newTopicId || "none"}
                    onValueChange={(v) => setNewTopicId(v === "none" || !v ? "" : v)}
                  >
                    <SelectTrigger id="mat-topic" className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(Không chọn)</SelectItem>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mat-cefr">Trình độ CEFR</Label>
                  <Select value={newCefr} onValueChange={(v) => v && setNewCefr(v)}>
                    <SelectTrigger id="mat-cefr" className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map((b) => (
                        <SelectItem key={b} value={b}>
                          Bậc {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={pending || !newTitle.trim()} className="w-full mt-2">
                  Tải lên tài liệu
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </>
        }
      />

      {/* Folders Grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Thư mục ({folders.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card
            onClick={() => setSelectedFolder(null)}
            className={`cursor-pointer transition-all ${
              selectedFolder === null ? "border-2 border-[var(--persona)] bg-[var(--persona-soft)]" : "hover:border-[var(--persona-border)]"
            }`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Folder className="size-8 text-[var(--persona)] shrink-0" />
              <div>
                <p className="font-semibold text-sm">Tất cả tài liệu</p>
                <p className="text-xs text-muted-foreground">{materials.length} tài liệu</p>
              </div>
            </CardContent>
          </Card>
          {folders.map((f) => (
            <Card
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`cursor-pointer transition-all ${
                selectedFolder === f.id ? "border-2 border-[var(--persona)] bg-[var(--persona-soft)]" : "hover:border-[var(--persona-border)]"
              }`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Folder className="size-8 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.count} tài liệu</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tài liệu…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={levelFilter} onValueChange={(v) => v && setLevelFilter(v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả CEFR</SelectItem>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((b) => (
                <SelectItem key={b} value={b}>
                  CEFR {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Materials List */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Danh sách tài liệu ({filteredMaterials.length})
        </h2>
        {filteredMaterials.length === 0 ? (
          <Card>
            <EmptyState icon={Search} text="Chưa có tài liệu nào trong danh mục này." />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredMaterials.map((m) => (
              <Card key={m.id} className="transition-all hover:border-[var(--persona-border)]">
                <CardContent className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-6 text-[var(--persona)] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.topicTitle ? `Bài học: ${m.topicTitle} · ` : ""}
                        Tải lên: {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CefrBadge level={m.cefrLevel} />
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                      {m.fileType}
                    </span>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <Download size={15} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
