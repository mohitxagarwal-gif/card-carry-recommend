import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useAuthRedirect = (shouldRedirect: boolean = true) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user || !shouldRedirect) {
          setIsChecking(false);
          return;
        }

        // Wait briefly for profile to be created by trigger
        let attempts = 0;
        let profile = null;
        
        while (attempts < 5 && !profile) {
          const { data } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single();
          
          if (data) {
            profile = data;
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
          attempts++;
        }

        if (profile) {
          if (profile.onboarding_completed) {
            navigate("/upload", { replace: true });
          } else {
            navigate("/onboarding/basics", { replace: true });
          }
        } else {
          // Profile doesn't exist yet, default to onboarding
          navigate("/onboarding/basics", { replace: true });
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndProfile();
  }, [navigate, shouldRedirect]);

  return { isChecking, user };
};
