"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Mascot, Spinner } from "@/components/ui";
import { User, Mail, Phone, MapPin, School, Calendar, Brain, Heart, Target, Save, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  learningStyle: string | null;
  interests: string[];
  strengths: string[];
  weaknesses: string[];
  aptitudeCompleted: boolean;
  completedAt: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    address: "",
    school: "",
    dateOfBirth: "",
  });

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  React.useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || "",
      }));
      
      // Fetch profile data
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      // Fetch aptitude data
      const aptitudeResponse = await fetch("/api/profile/aptitude");
      const aptitudeData = await aptitudeResponse.json();
      
      if (aptitudeData.success && aptitudeData.data) {
        setProfile(aptitudeData.data);
      }

      // Fetch personal information
      const profileResponse = await fetch("/api/profile");
      const profileData = await profileResponse.json();
      
      if (profileData.success && profileData.data) {
        setFormData((prev) => ({
          ...prev,
          name: profileData.data.name || session?.user?.name || "",
          phone: profileData.data.phoneNumber || "",
          address: profileData.data.address || "",
          school: profileData.data.school || "",
          dateOfBirth: profileData.data.dateOfBirth || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phoneNumber: formData.phone || null,
          address: formData.address || null,
          school: formData.school || null,
          dateOfBirth: formData.dateOfBirth || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session if name changed
        if (data.data.name && session?.user) {
          // Trigger a session update by refreshing
          window.location.reload();
        } else {
          // Show success message (you can add a toast notification here)
          alert("Profile updated successfully!");
        }
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const learningStyleLabels: Record<string, string> = {
    VISUAL: "Visual Learner",
    AUDITORY: "Auditory Learner",
    READING_WRITING: "Reading/Writing Learner",
    KINESTHETIC: "Kinesthetic Learner",
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
                  {session.user.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {session.user.name}
              </h2>
              <p className="text-muted-foreground">{session.user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  Student
                </span>
                {profile?.aptitudeCompleted && (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                    Aptitude Complete
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aptitude Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Aptitude Profile
          </CardTitle>
          <CardDescription>
            Your learning style and career interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.aptitudeCompleted ? (
            <div className="space-y-6">
              {/* Learning Style */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Learning Style</p>
                  <p className="font-semibold text-foreground">
                    {profile.learningStyle 
                      ? learningStyleLabels[profile.learningStyle] || profile.learningStyle
                      : "Not determined"}
                  </p>
                </div>
              </div>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-primary" />
                    <p className="font-medium text-foreground">Interests</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                      >
                        {interest.charAt(0).toUpperCase() + interest.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {profile.strengths && profile.strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary" />
                    <p className="font-medium text-foreground">Strengths</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="px-3 py-1.5 rounded-full bg-tertiary text-tertiary-foreground text-sm"
                      >
                        {strength.replace("_", " ").charAt(0).toUpperCase() + strength.slice(1).replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed date */}
              {profile.completedAt && (
                <p className="text-sm text-muted-foreground">
                  Completed on {new Date(profile.completedAt).toLocaleDateString()}
                </p>
              )}

              <Link href="/onboarding">
                <Button variant="outline" size="sm">
                  Retake Assessment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mascot size="lg" mood="waving" animate={false} />
              <h3 className="font-semibold text-foreground mt-4">
                Complete Your Aptitude Test
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Take our aptitude assessment to discover your learning style and get personalized career recommendations.
              </p>
              <Link href="/onboarding" className="inline-block mt-4">
                <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Assessment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Email"
                type="email"
                value={session.user.email || ""}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
                hint="Email cannot be changed"
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+232 XX XXX XXXX"
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
              <Input
                label="School/Institution"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="Enter your school name"
                leftIcon={<School className="w-4 h-4" />}
              />
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

