import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const COURSE_FIELDS = "id,name,region,city,course_type,art_shape,distance_km,difficulty,traffic_lights,toilets,night_recommended,route_geojson,tags,surface,loop_type,verified,start_name,elevation_gain_m,data_quality";

export const getApprovedCourseCatalog = unstable_cache(async () => {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await sb.from("runart_courses").select(COURSE_FIELDS).eq("status", "approved").order("name");
  if (error) throw error;
  return (data ?? []).map((course) => ({ ...course, distance_km: Number(course.distance_km) }));
}, ["approved-course-catalog-v1"], { revalidate: 3600, tags: ["approved-courses"] });
