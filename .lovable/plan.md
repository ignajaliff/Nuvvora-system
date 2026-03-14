

## Voice Task Capture - Plan

### Overview
Add a voice recording feature to the "Nueva tarea" dialog that records audio, sends it to Gemini via an edge function, and auto-fills the form with AI-generated title, description, due date (+2 days), and status ("todo").

### Architecture

```text
┌─────────────────────┐     audio blob      ┌──────────────────────┐
│  TasksPage Dialog    │ ──────────────────> │  Edge Function       │
│  (MediaRecorder API) │                     │  transcribe-task     │
│  + empresa name      │ <────────────────── │  (Lovable AI Gateway)│
│  ← JSON {titulo,     │    JSON response    │  Gemini 2.5 Flash    │
│     descripcion}     │                     └──────────────────────┘
└─────────────────────┘
         │
         ▼
   Pre-filled form modal
   (user confirms → INSERT tareas)
```

### Step 1: Create Edge Function `transcribe-task`

**File:** `supabase/functions/transcribe-task/index.ts`

- Receives POST with `audio` (base64) and `empresa` (string)
- Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the system prompt:
  > "Eres un analista técnico. Analiza este audio y el nombre de la empresa seleccionada. Genera: 1. Un título técnico, 2. Una descripción detallada para un desarrollador. Devuelve los datos en formato JSON"
- Uses tool calling to extract structured `{ titulo, descripcion }` JSON
- Returns the structured response to the client
- Handles 429/402 errors gracefully

**Update** `supabase/config.toml` to add function with `verify_jwt = false`.

### Step 2: Modify the "Nueva tarea" Dialog in TasksPage

Enhance the existing dialog form:

1. **Project selector stays mandatory** - must select before recording
2. **Voice recorder in the Description area:**
   - Microphone button (uses `Mic` / `MicOff` from lucide-react)
   - When recording: button turns red with pulse animation, shows timer (MM:SS), simple animated waveform bars
   - When stopped: stores audio blob, triggers AI processing
3. **Loading state:** While AI processes, show a spinner overlay on the form with "Procesando audio con IA..."
4. **Auto-fill on AI response:**
   - `titulo` field populated with AI title
   - `descripcion` field populated with AI description
   - `estado` set to "todo" (Pendiente)
   - `entrega_programada` set to current date + 2 days
5. **User can edit all fields** before confirming and creating the task
6. **Error handling:** Toast on recording/AI failures

### Step 3: Visual Design Details

- Mic button: `rounded-full` with `bg-muted` default, `bg-red-500 text-white animate-pulse` when recording
- Timer: small `font-mono` text next to mic button
- Waveform: 4-5 small bars with staggered CSS animation heights
- Loading overlay: semi-transparent with centered spinner and text
- All using existing Shadcn components (Button, Dialog, Input, Select, Label, Textarea)

### Technical Notes

- Audio captured as `audio/webm` via MediaRecorder API, converted to base64 for transmission
- Edge function uses `LOVABLE_API_KEY` (already available) for Lovable AI Gateway
- No new database changes needed - uses existing `tareas` table
- The voice feature is additive - manual text entry still works as before

