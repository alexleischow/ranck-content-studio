import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { strategyId, data, companyName } = await req.json();
    const supabase = await createServiceClient();

    if (strategyId) {
      const { data: saved, error } = await supabase
        .from("strategy")
        .update({ ...data, company_name: companyName, updated_at: new Date().toISOString() })
        .eq("id", strategyId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(saved);
    } else {
      const { data: saved, error } = await supabase
        .from("strategy")
        .insert({ ...data, company_name: companyName })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(saved);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
