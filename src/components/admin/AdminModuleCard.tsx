import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export const AdminModuleCard = ({ title, description, icon: Icon, href }: AdminModuleCardProps) => {
  return (
    <Link to={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full justify-between">
            Manage
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};
