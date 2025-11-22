-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('student', 'member', 'officer', 'leader', 'sao', 'admin');

-- Create enum for membership status
CREATE TYPE public.membership_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create enum for organization status
CREATE TYPE public.org_status AS ENUM ('pending', 'active', 'hold', 'hiatus');

-- Create enum for event visibility
CREATE TYPE public.visibility_type AS ENUM ('public', 'private');

-- Create enum for event status
CREATE TYPE public.event_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_picture TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  profile_picture TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  status org_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create memberships table
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role app_role DEFAULT 'member' NOT NULL,
  status membership_status DEFAULT 'pending' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, org_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  visibility visibility_type DEFAULT 'public' NOT NULL,
  status event_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  posted_by UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility visibility_type DEFAULT 'public' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  position_applied TEXT NOT NULL,
  status membership_status DEFAULT 'pending' NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id 
    AND org_id = _org_id 
    AND status = 'accepted'
  )
$$;

-- Create function to check if user is org officer/leader
CREATE OR REPLACE FUNCTION public.is_org_officer(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id 
    AND org_id = _org_id 
    AND status = 'accepted'
    AND role IN ('officer', 'leader')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "User roles viewable by authenticated users"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for organizations
CREATE POLICY "Active organizations viewable by everyone"
  ON public.organizations FOR SELECT
  USING (status = 'active' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Officers can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.is_org_officer(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for memberships
CREATE POLICY "Users can view their own memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_org_officer(auth.uid(), org_id));

CREATE POLICY "Users can create membership requests"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Officers can update memberships"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (public.is_org_officer(auth.uid(), org_id));

-- RLS Policies for events
CREATE POLICY "Public events viewable by everyone"
  ON public.events FOR SELECT
  USING (
    visibility = 'public' 
    OR public.is_org_member(auth.uid(), org_id)
    OR public.has_role(auth.uid(), 'sao')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Leaders can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_officer(auth.uid(), org_id)
    AND auth.uid() = created_by
  );

CREATE POLICY "SAO can update event status"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'sao') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for announcements
CREATE POLICY "Public announcements viewable by everyone"
  ON public.announcements FOR SELECT
  USING (
    visibility = 'public'
    OR public.is_org_member(auth.uid(), org_id)
  );

CREATE POLICY "Officers can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_officer(auth.uid(), org_id)
    AND auth.uid() = posted_by
  );

CREATE POLICY "Officers can update their announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (posted_by = auth.uid());

-- RLS Policies for applications
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_org_officer(auth.uid(), org_id));

CREATE POLICY "Users can create applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Officers can update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.is_org_officer(auth.uid(), org_id));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;