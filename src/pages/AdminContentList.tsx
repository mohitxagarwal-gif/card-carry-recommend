import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useContentFeed } from "@/hooks/useContentFeed";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ContentForm {
  id?: string;
  title: string;
  description: string;
  url: string;
  tag: string;
  is_evergreen: boolean;
  target_income_bands: string[];
  target_categories: string[];
}

const AdminContentList = () => {
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { content, isLoading: contentLoading, addContent, updateContent, deleteContent } = useContentFeed();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ContentForm>({
    title: "",
    description: "",
    url: "",
    tag: "",
    is_evergreen: true,
    target_income_bands: [],
    target_categories: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to access admin panel");
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [role, roleLoading, navigate]);

  const handleSubmit = () => {
    if (formData.id) {
      updateContent({ id: formData.id, updates: formData });
    } else {
      addContent(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      title: item.title,
      description: item.description || "",
      url: item.url || "",
      tag: item.tag || "",
      is_evergreen: item.is_evergreen,
      target_income_bands: item.target_income_bands || [],
      target_categories: item.target_categories || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    deleteContent(id);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      url: "",
      tag: "",
      is_evergreen: true,
      target_income_bands: [],
      target_categories: [],
    });
  };

  if (roleLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Content Feed</h1>
            <p className="text-muted-foreground">Manage recommended reading articles</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Article
          </Button>
        </div>

        <div className="grid gap-4">
          {content?.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="mt-2">{item.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center">
                  {item.tag && <Badge variant="secondary">{item.tag}</Badge>}
                  {item.is_evergreen && <Badge>Evergreen</Badge>}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      View Article →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{formData.id ? "Edit" : "Add"} Article</DialogTitle>
              <DialogDescription>
                {formData.id ? "Update" : "Create"} a recommended reading article
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tag">Tag</Label>
                <Input
                  id="tag"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="e.g., Dining, Travel"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="evergreen"
                  checked={formData.is_evergreen}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_evergreen: checked })}
                />
                <Label htmlFor="evergreen">Evergreen Content</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminContentList;
