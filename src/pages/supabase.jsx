import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://vkohplbmgljymydhxjrn.supabase.co",
  "sb_publishable_8kkpGo8wgxP_DKn7fqeQow_ADMIaIrI"
);