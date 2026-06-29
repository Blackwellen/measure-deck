export interface XERTask {
  task_id: string;
  task_name: string;
  start_date: Date;
  end_date: Date;
  duration_days: number;
  percent_complete: number;
  predecessors: string[];
  wbs_path: string;
}

export interface XERParseResult {
  project_name: string;
  start_date: Date;
  finish_date: Date;
  tasks: XERTask[];
  total_tasks: number;
  parse_errors: string[];
}

function parseOracleDate(raw: string): Date | null {
  if (!raw || !raw.trim()) return null;
  const clean = raw.trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const [, yr, mo, dy, hr, mn] = match;
    return new Date(
      Number(yr),
      Number(mo) - 1,
      Number(dy),
      Number(hr),
      Number(mn),
      0
    );
  }
  const plain = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plain) {
    const [, yr, mo, dy] = plain;
    return new Date(Number(yr), Number(mo) - 1, Number(dy));
  }
  return null;
}

interface TableSection {
  fields: string[];
  rows: string[][];
}

function parseSections(lines: string[]): Record<string, TableSection> {
  const sections: Record<string, TableSection> = {};
  let current: string | null = null;
  let fields: string[] = [];

  for (const line of lines) {
    if (line.startsWith("%T\t") || line.startsWith("%T ")) {
      current = line.replace(/^%T[\t ]/, "").trim();
      fields = [];
      sections[current] = { fields: [], rows: [] };
    } else if (current && (line.startsWith("%F\t") || line.startsWith("%F "))) {
      fields = line.replace(/^%F[\t ]/, "").split("\t").map((f) => f.trim());
      sections[current].fields = fields;
    } else if (current && (line.startsWith("%R\t") || line.startsWith("%R "))) {
      const values = line.replace(/^%R[\t ]/, "").split("\t");
      sections[current].rows.push(values);
    }
  }

  return sections;
}

function buildWbsMap(section: TableSection | undefined): Record<string, string> {
  if (!section) return {};
  const map: Record<string, string> = {};
  const fi = (n: string) => section.fields.indexOf(n);
  const idIdx = fi("wbs_id");
  const nameIdx = fi("wbs_name");
  const parentIdx = fi("parent_wbs_id");

  if (idIdx < 0 || nameIdx < 0) return {};

  const names: Record<string, string> = {};
  const parents: Record<string, string> = {};

  for (const row of section.rows) {
    const id = (row[idIdx] ?? "").trim();
    const name = (row[nameIdx] ?? "").trim();
    const parent = parentIdx >= 0 ? (row[parentIdx] ?? "").trim() : "";
    names[id] = name;
    parents[id] = parent;
  }

  function buildPath(id: string, visited = new Set<string>()): string {
    if (!id || visited.has(id)) return names[id] ?? id;
    visited.add(id);
    const parent = parents[id];
    if (parent && parent !== id && names[parent]) {
      return buildPath(parent, visited) + " > " + (names[id] ?? id);
    }
    return names[id] ?? id;
  }

  for (const id of Object.keys(names)) {
    map[id] = buildPath(id);
  }

  return map;
}

function buildPredMap(section: TableSection | undefined): Record<string, string[]> {
  if (!section) return {};
  const map: Record<string, string[]> = {};
  const fi = (n: string) => section.fields.indexOf(n);
  const taskIdx = fi("task_id");
  const predIdx = fi("pred_task_id");

  if (taskIdx < 0 || predIdx < 0) return {};

  for (const row of section.rows) {
    const taskId = (row[taskIdx] ?? "").trim();
    const predId = (row[predIdx] ?? "").trim();
    if (!taskId || !predId) continue;
    if (!map[taskId]) map[taskId] = [];
    map[taskId].push(predId);
  }

  return map;
}

export function parseXER(content: string): XERParseResult {
  const parseErrors: string[] = [];
  const lines = content.split(/\r?\n/);
  const sections = parseSections(lines);

  const wbsMap = buildWbsMap(sections["WBS"]);
  const predMap = buildPredMap(sections["TASKPRED"]);

  const projectSection = sections["PROJECT"];
  let projectName = "Imported Project";
  let projectStart: Date = new Date();
  let projectFinish: Date = new Date();

  if (projectSection) {
    const pf = (n: string) => projectSection.fields.indexOf(n);
    const nameIdx = pf("proj_short_name");
    const startIdx = pf("plan_start_date");
    const finishIdx = pf("scd_end_date");

    for (const row of projectSection.rows) {
      if (nameIdx >= 0 && row[nameIdx]) projectName = row[nameIdx].trim();
      if (startIdx >= 0 && row[startIdx]) {
        const d = parseOracleDate(row[startIdx]);
        if (d) projectStart = d;
      }
      if (finishIdx >= 0 && row[finishIdx]) {
        const d = parseOracleDate(row[finishIdx]);
        if (d) projectFinish = d;
      }
      break;
    }
  }

  const taskSection = sections["TASK"];
  const tasks: XERTask[] = [];

  if (!taskSection) {
    parseErrors.push("No TASK table found in XER file");
    return {
      project_name: projectName,
      start_date: projectStart,
      finish_date: projectFinish,
      tasks: [],
      total_tasks: 0,
      parse_errors: parseErrors,
    };
  }

  const tf = (n: string) => taskSection.fields.indexOf(n);
  const idIdx = tf("task_id");
  const nameIdx = tf("task_name");
  const startIdx = tf("act_start_date") >= 0 ? tf("act_start_date") : tf("early_start_date");
  const endIdx = tf("act_end_date") >= 0 ? tf("act_end_date") : tf("early_end_date");
  const durIdx = tf("target_drtn_hr_cnt");
  const pctIdx = tf("phys_complete_pct");
  const wbsIdx = tf("wbs_id");

  if (idIdx < 0 || nameIdx < 0) {
    parseErrors.push("TASK table missing required fields (task_id, task_name)");
    return {
      project_name: projectName,
      start_date: projectStart,
      finish_date: projectFinish,
      tasks: [],
      total_tasks: 0,
      parse_errors: parseErrors,
    };
  }

  for (let i = 0; i < taskSection.rows.length; i++) {
    const row = taskSection.rows[i];
    const taskId = (row[idIdx] ?? "").trim();
    const taskName = (row[nameIdx] ?? "").trim();

    if (!taskId || !taskName) continue;

    let startDate = projectStart;
    let endDate = projectFinish;
    let durationDays = 0;
    let pctComplete = 0;

    if (startIdx >= 0 && row[startIdx]) {
      const d = parseOracleDate(row[startIdx]);
      if (d) startDate = d;
      else parseErrors.push(`Row ${i}: unparseable start date for task ${taskId}`);
    }

    if (endIdx >= 0 && row[endIdx]) {
      const d = parseOracleDate(row[endIdx]);
      if (d) endDate = d;
    }

    if (durIdx >= 0 && row[durIdx]) {
      const hours = parseFloat(row[durIdx]);
      if (!isNaN(hours)) durationDays = Math.round(hours / 8);
    }

    if (durationDays === 0 && endDate > startDate) {
      durationDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
    }

    if (pctIdx >= 0 && row[pctIdx]) {
      const v = parseFloat(row[pctIdx]);
      if (!isNaN(v)) pctComplete = Math.min(100, Math.max(0, v));
    }

    const wbsId = wbsIdx >= 0 ? (row[wbsIdx] ?? "").trim() : "";
    const wbsPath = wbsId && wbsMap[wbsId] ? wbsMap[wbsId] : "";

    tasks.push({
      task_id: taskId,
      task_name: taskName,
      start_date: startDate,
      end_date: endDate,
      duration_days: durationDays,
      percent_complete: pctComplete,
      predecessors: predMap[taskId] ?? [],
      wbs_path: wbsPath,
    });
  }

  const allStarts = tasks.map((t) => t.start_date.getTime());
  const allEnds = tasks.map((t) => t.end_date.getTime());
  if (allStarts.length > 0) {
    projectStart = new Date(Math.min(...allStarts));
    projectFinish = new Date(Math.max(...allEnds));
  }

  return {
    project_name: projectName,
    start_date: projectStart,
    finish_date: projectFinish,
    tasks,
    total_tasks: tasks.length,
    parse_errors: parseErrors,
  };
}
