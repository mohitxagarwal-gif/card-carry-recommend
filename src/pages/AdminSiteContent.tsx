import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteContent } from "@/hooks/useSiteContent";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, FileText } from "lucide-react";
import { toast } from "sonner";

interface ContentForm {
  section: string;
  content: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
}

const AdminSiteContent = () => {
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { siteContent, isLoading: contentLoading, updateContent } = useSiteContent();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContentForm>({
    section: "",
    content: {},
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate("/auth");
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      navigate("/");
    }
  }, [role, roleLoading, navigate]);

  const handleEdit = (item: any) => {
    setEditingSection(item.section);
    setFormData({
      section: item.section,
      content: item.content,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.section) {
      toast.error("Section name is required");
      return;
    }

    updateContent({
      section: formData.section,
      content: formData.content,
    });

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ section: "", content: {} });
    setEditingSection(null);
  };

  if (roleLoading || contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const contentArray = Array.isArray(siteContent) ? siteContent : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Site Content Manager</h1>
          <p className="text-muted-foreground">
            Manage content sections across your site without code changes
          </p>
        </div>

        <div className="grid gap-4">
          {contentArray.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {item.section}
                    </CardTitle>
                    <CardDescription>
                      Last updated: {new Date(item.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  {item.content?.title && (
                    <div>
                      <span className="font-semibold">Title: </span>
                      {item.content.title}
                    </div>
                  )}
                  {item.content?.description && (
                    <div>
                      <span className="font-semibold">Description: </span>
                      {item.content.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? `Edit ${editingSection}` : "Add Content Section"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section">Section Name</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., hero, about, faq"
                  disabled={!!editingSection}
                />
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.content.title || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, title: e.target.value },
                    })
                  }
                  placeholder="Section title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.content.description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, description: e.target.value },
                    })
                  }
                  placeholder="Section description"
                />
              </div>

              <div>
                <Label htmlFor="json">Additional Content (JSON)</Label>
                <Textarea
                  id="json"
                  rows={8}
                  value={JSON.stringify(
                    Object.fromEntries(
                      Object.entries(formData.content).filter(
                        ([key]) => !["title", "description"].includes(key)
                      )
                    ),
                    null,
                    2
                  )}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({
                        ...formData,
                        content: {
                          title: formData.content.title,
                          description: formData.content.description,
                          ...parsed,
                        },
                      });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  Save Content
                </Button>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSiteContent;
