-- Create public bucket for card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true);

-- Allow public read access to card images
CREATE POLICY "Public can view card images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'card-images');

-- Only admins can upload card images
CREATE POLICY "Admins can upload card images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Only admins can update card images
CREATE POLICY "Admins can update card images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'card-images' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Only admins can delete card images
CREATE POLICY "Admins can delete card images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'card-images' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );