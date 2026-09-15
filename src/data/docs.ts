export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'callout'; tone: 'info' | 'warning' | 'success'; title: string; text: string }
  | { type: 'code'; language: 'cpp' | 'text' | 'cmake'; code: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

export type DocPage = {
  id: string
  group: string
  title: string
  summary: string
  tags: string[]
  blocks: Block[]
}

export const docPages: DocPage[] = [
  {
    id: 'welcome', group: 'Start here', title: 'Duality Engine for Nintendo 3DS',
    summary: 'A C++ game engine and editor designed around the Nintendo 3DS dual-screen hardware.',
    tags: ['overview', '3ds', 'architecture', 'editor'],
    blocks: [
      { type: 'paragraph', text: 'Duality is a native C++17 engine for Nintendo 3DS and desktop iteration. It uses the same scene and gameplay code on both hosts: OpenGL powers the desktop editor/player, while Citro2D and Citro3D power hardware and Citra builds.' },
      { type: 'callout', tone: 'success', title: 'Mental model', text: 'Author content in the editor, write Behaviour subclasses in C++, build scripts into GameScripts, then cook only assets reachable from the configured Build Settings scenes into romfs.' },
      { type: 'table', headers: ['Layer', 'Responsibility', 'Main entry points'], rows: [
        ['Core / ECS', 'Entity lifetime, hierarchy, serialisation, reflection', 'Scene, Entity, Components, SceneSerializer'],
        ['Runtime services', 'Input, audio, physics, scene queries exposed to scripts', 'Input, Audio, Physics2D/3D, Debug, Scene'],
        ['Rendering', '2D sprites/UI and 3D meshes on each physical screen', 'SceneRenderer, IRenderer2D/3D'],
        ['Platform', '3DS GPU, HID, touch, APT lifecycle and packaging', 'Citro2DRenderer, Citro3DRenderer, DualityPlayer'],
        ['Editor', 'Scenes, assets, build settings, inspectors and script reload', 'DualityEditor']
      ] },
      { type: 'paragraph', text: 'This site deliberately separates public gameplay API from engine internals and raw devkitPro APIs. Raw libctru/Citro3D calls are useful for engine and platform packages; ordinary games should stay on Duality APIs so desktop and 3DS remain compatible.' }
    ]
  },
  {
    id: 'quick-start', group: 'Start here', title: 'First playable scene',
    summary: 'Create a bottom-screen 2D scene, attach a script, then configure and build it.',
    tags: ['getting started', 'scene', 'behaviour', 'build'],
    blocks: [
      { type: 'list', items: ['Create or open a .dproj project in DualityEditor.', 'Create a root named ---Bottom. Use its children for touch gameplay; create ---Top for the top display when needed.', 'Add a Bottom camera, then drag a texture into the Bottom 2D Scene view to create a SpriteRenderer entity.', 'Create a C++ Behaviour from Content Browser, rename it before creation, then add it in the Inspector.', 'Add the scene in Build Settings and choose Set Start. The selected Start Scene is stored in the .dproj, not inferred from Assets/Scene.scene.', 'Choose the 3DS anti-aliasing mode in Build Settings, Apply + Reload Scripts, then Build for 3DS.'] },
      { type: 'code', language: 'cpp', code: '#include <DualityEngine/Scene/Behaviour.h>\n#include <DualityEngine/Scripting/Debug.h>\n#include <DualityEngine/Scripting/Transform.h>\n\nclass Spinner final : public Duality::Behaviour {\npublic:\n    void OnCreate() override { Debug::Log("Spinner is ready"); }\n    void OnUpdate(float dt) override {\n        Transform(GetEntity()).SetRotationZ(\n            Transform(GetEntity()).GetRotationZ() + 90.0f * dt);\n    }\n};' },
      { type: 'callout', tone: 'warning', title: 'Do not put override in the .cpp definition', text: 'override belongs only on the member declaration inside the class. Write void Spinner::OnUpdate(float dt) { ... } in the .cpp file.' },
      { type: 'paragraph', text: 'For 2D gameplay, choose Orthographic camera projection and work in world units. Pixels-per-unit (PPU) and gravity are Project Settings values: they make physics values predictable without forcing authored transforms to be expressed in screen pixels.' }
    ]
  },
  {
    id: 'project-layout', group: 'Start here', title: 'Project, assets and packages',
    summary: 'What belongs in Assets, Packages and the .dproj file.',
    tags: ['assets', 'packages', 'dproj', 'prefab', 'build'],
    blocks: [
      { type: 'table', headers: ['Path', 'Purpose', 'Cooked into build?'], rows: [
        ['Assets/', 'Project-owned scenes, scripts, textures, materials, prefabs and data', 'Only assets reachable from included scenes and their references'],
        ['Packages/<id>/', 'Reusable package source/assets, described by package.json', 'Only enabled package assets/references'],
        ['Project.dproj', 'Project name, build scenes, Start Scene, PPU/gravity, defines, 3DS settings', 'Configuration only'],
        ['Library/ or build/', 'Generated/import/build cache', 'No; never author content here']
      ] },
      { type: 'paragraph', text: 'Asset references are GUID-based AssetRef values. This makes a moved/renamed source asset continue to resolve after its .meta file moves with it. A scene/prefab/scriptable object serialises an AssetRef, EntityRef, vectors, primitives and reflected properties rather than a raw host path.' },
      { type: 'code', language: 'text', code: 'Packages/\n  com.example.tween/\n    package.json          # name, version, display name\n    Include/              # public headers\n    Source/               # implementation compiled with GameScripts\n    Assets/               # optional package assets\n    README.md' },
      { type: 'callout', tone: 'info', title: 'Package boundary', text: 'Packages compile into the project GameScripts target. Therefore package gameplay code must only depend on headers exposed to scripts; do not link directly against editor-only or private renderer implementation classes.' }
    ]
  },
  {
    id: 'ecs-scene', group: 'Core runtime', title: 'ECS, entities and scene hierarchy',
    summary: 'The scene owns EnTT storage; Entity is a lightweight, validated handle.',
    tags: ['ecs', 'entity', 'scene', 'transform', 'hierarchy'],
    blocks: [
      { type: 'paragraph', text: 'Scene owns the EnTT registry and every Entity is a pair of an entt handle and its Scene*. Entity::operator bool checks liveness, not merely a non-null numeric handle. A saved EntityRef stores a stable scene-local handle and must be resolved by the Behaviour before it is used.' },
      { type: 'list', items: ['Every entity owns TransformComponent, NameComponent, TagComponent and ActiveComponent.', 'Parent/child relationships are scene-owned. Effective activity is parent-aware: inactive parents suppress their descendants’ update, physics and rendering.', 'Structural operations invalidate borrowed ECS component pointers. Reacquire pointers after AddComponent, RemoveComponent, destroy, scene reload or hierarchy mutation.', 'Destroying an entity destroys its descendant subtree. ClearChildren destroys direct children and all their descendants.'] },
      { type: 'code', language: 'cpp', code: 'Entity target = ResolveEntityRef(Target);\nif (!target) return;\n\nif (auto* sprite = target.TryGetComponent<SpriteRendererComponent>())\n    sprite->Color.a = 0.5f;\n\nfor (Entity child : GetChildren())\n    Debug::Log(child.GetComponent<NameComponent>().Name);' },
      { type: 'callout', tone: 'warning', title: 'Entity order is not render order', text: 'Hierarchy sibling order is authoring order and a tie-breaker only where documented. Sprite rendering should be controlled explicitly with sorting layer/order; 3D rendering uses depth and camera state.' }
    ]
  },
  {
    id: 'behaviour-lifecycle', group: 'Core runtime', title: 'Behaviour lifecycle and safe scripts',
    summary: 'The C++ MonoBehaviour-equivalent and the rules that keep runtime errors recoverable.',
    tags: ['behaviour', 'lifecycle', 'scripts', 'crash safety'],
    blocks: [
      { type: 'table', headers: ['Callback', 'When it runs', 'Typical use'], rows: [
        ['OnCreate', 'Once at Play start even if initially inactive', 'Initialise cached values and validate references'],
        ['OnEnable / OnDisable', 'Effective active state changes', 'Subscribe/unsubscribe and begin/end effects'],
        ['OnUpdate(float dt)', 'Every runtime frame while enabled and effectively active', 'Gameplay movement and input'],
        ['OnCollisionEnter/Exit', 'Non-trigger contact edge, each entity receives other', 'Impact behaviour'],
        ['OnTriggerEnter/Exit', 'Contact edge when either collider is trigger', 'Pickups, sensors'],
        ['OnApplicationFocus/Pause/Quit', 'Host lifecycle; APT maps these on 3DS', 'Save checkpoints, audio/network pause'],
        ['OnDestroy', 'Runtime teardown', 'Release subscriptions/handles']
      ] },
      { type: 'paragraph', text: 'A Behaviour intentionally exposes only GetEntity and GetTransform as universal convenience. Create wrappers explicitly when needed: SpriteRenderer(GetEntity()), Rigidbody2D(GetEntity()), AudioSource(GetEntity()) and so on. This prevents every script from pulling in render, physics, UI and audio headers.' },
      { type: 'code', language: 'cpp', code: 'void Fruit::OnPointerDown(PointerEventData& eventData) {\n    if (eventData.Screen != Screen::Bottom) return;\n    if (auto* body = GetEntity().TryGetComponent<Rigidbody2DComponent>()) {\n        Rigidbody2D(GetEntity()).AddForce({ 0.0f, 3.0f });\n    }\n}' },
      { type: 'callout', tone: 'warning', title: 'Failure containment', text: 'Use TryGetComponent, test Entity truthiness and test wrapper truthiness before work. Do not retain component pointers across structural changes. Script callbacks are engine boundaries; keep failures logged and disable the faulty behaviour rather than taking down the host.' }
    ]
  },
  {
    id: 'rendering', group: 'Engine systems', title: 'Rendering architecture',
    summary: 'A shared scene renderer targets two physical displays through 2D and 3D backend interfaces.',
    tags: ['renderer', 'sprite', 'mesh', 'camera', 'canvas', 'citro3d'],
    blocks: [
      { type: 'table', headers: ['Stage', 'Desktop', 'Nintendo 3DS'], rows: [
        ['2D implementation', 'OpenGLRenderer2D', 'Citro2DRenderer'],
        ['3D implementation', 'OpenGLRenderer3D', 'Citro3DRenderer'],
        ['Scene traversal', 'SceneRenderer', 'SceneRenderer'],
        ['Screen targets', 'Editor/player framebuffers', 'Citro2D-created top/bottom C3D render targets'],
        ['Presentation', 'Window swap', 'C3D_FrameEnd / display transfer']
      ] },
      { type: 'paragraph', text: 'SceneRenderer decides what can render on Top or Bottom, resolves AssetRef resources and dispatches SpriteRenderer, SpriteFlipbook, MeshRenderer, LineRenderer and Canvas UI. Cameras choose screen, orthographic/perspective projection, culling mask, clip planes, clear colour and primary ordering.' },
      { type: 'list', items: ['2D sprite sorting: sorting layer/order is primary; a deterministic scene/sibling tie-breaker is used when ordering values are equal.', '3D mesh sorting: depth testing is authoritative for opaque meshes. Do not try to use 2D sort order to solve real 3D occlusion.', 'Canvas UI is rendered after scene content on its configured screen. Screen-space UI is the correct target for touch controls.', 'Citro3DRenderer re-binds global GPU state for each mesh draw because Citro2D and Citro3D share Citro3D frame state.'] },
      { type: 'callout', tone: 'info', title: '3DS anti-aliasing', text: 'Build Settings display-transfer anti-aliasing is platform-specific. It is intentionally separate from sprite filtering and render sorting; preserve it when refactoring renderer settings.' }
    ]
  },
  {
    id: 'physics', group: 'Engine systems', title: 'Physics, units and raycasts',
    summary: '2D and 3D physics use one authored world-unit convention.',
    tags: ['physics', 'box2d', 'bullet', 'raycast', 'ppu', 'gravity'],
    blocks: [
      { type: 'paragraph', text: 'Duality uses a configurable pixels-per-unit conversion for authored 2D content and a world-space gravity value. PhysicsUnits converts between world and backend units so gameplay values such as speed, jump impulse and gravity stay understandable at the project level.' },
      { type: 'table', headers: ['System', 'Backend / shape set', 'Gameplay entry point'], rows: [
        ['Physics2D', 'Box2D; box and circle colliders', 'Rigidbody2D, Collider2D, Physics2D::Raycast'],
        ['Physics3D', 'Bullet; box and sphere colliders', 'Rigidbody3D, Collider3D, Physics3D::Raycast'],
        ['Pointer rays', 'Screen point converted by active camera', 'Physics3D::ScreenPointToRay / raycasters']
      ] },
      { type: 'code', language: 'cpp', code: 'RaycastHit2D hit = Physics2D::Raycast(origin, direction, 8.0f);\nif (hit) {\n    Debug::Log("hit entity at " + std::to_string(hit.Distance));\n}\n\nRigidbody2D rb(GetEntity());\nif (rb) {\n    rb.SetVelocity({ 2.0f, rb.GetVelocity().y });\n}' },
      { type: 'callout', tone: 'warning', title: 'Choose one plane for 2D', text: 'Keep 2D gameplay on a consistent plane and use an orthographic camera. Do not mix raw pixel coordinates with physics positions: convert only at UI/screen boundaries.' }
    ]
  },
  {
    id: 'input-ui', group: 'Game APIs', title: 'Input, touch and Canvas UI',
    summary: 'Platform-neutral input APIs with a bottom-screen touch model.',
    tags: ['input', 'touch', 'ui', 'canvas', 'pointer'],
    blocks: [
      { type: 'paragraph', text: 'Input is the game-facing static API; InputManager is the host implementation. Each host samples hardware once at frame start, then Input exposes held/down/up button state, named axes and touch pointer data. On 3DS, touch coordinates are Bottom screen pixels and the engine maps them through UI/camera interactions.' },
      { type: 'code', language: 'cpp', code: 'if (Input::GetKeyDown(KeyCode::A))\n    Select();\n\nif (Input::GetPointerDown() && Input::GetPointerScreen() == Screen::Bottom) {\n    glm::vec2 touch = Input::GetPointerPosition();\n    Debug::Log("touch: " + std::to_string(touch.x));\n}' },
      { type: 'list', items: ['Use Canvas + UIRect + UIImage + UIText + UIButton for screen-space UI.', 'Pointer event handlers are dispatched by the engine. For simple click/touch, an entity needs a valid interaction target (UI element, or an appropriate scene raycaster/collider).', 'Do not require a Rigidbody simply to receive a UI click. Rigidbody is for simulation; pointer hit-testing uses the relevant UI/raycast path.', 'The Bottom screen is 320×240 touch pixels. Top is 400×240; stereoscopic left/right eye handling stays inside the platform renderer.'] }
    ]
  },
  {
    id: 'assets-serialization', group: 'Game APIs', title: 'Assets, prefabs and serialisation',
    summary: 'Natural reflected fields for asset, entity and ScriptableObject references.',
    tags: ['assetref', 'entityref', 'prefab', 'scriptable object', 'serialization'],
    blocks: [
      { type: 'paragraph', text: 'DUALITY_PROPERTY marks a field for reflection, Inspector editing and serialisation. Values are stored as JSON field overrides and reapplied to a script instance before OnCreate. ScriptableObject is a reflected data asset; EntityRef is a scene-local entity reference that a Behaviour resolves at runtime.' },
      { type: 'code', language: 'cpp', code: 'class LevelManager : public Behaviour {\npublic:\n    DUALITY_PROPERTY() AssetRef BoardPrefab;\n    DUALITY_PROPERTY() EntityRef SpawnRoot;\n    DUALITY_PROPERTY() FruitConfigSO FruitConfig;\n\n    void OnCreate() override {\n        Entity root = ResolveEntityRef(SpawnRoot);\n        if (root && BoardPrefab)\n            ScriptScene::Instantiate(BoardPrefab.Guid);\n    }\n};' },
      { type: 'table', headers: ['Value type', 'Stored as', 'Runtime use'], rows: [
        ['AssetRef', 'Asset GUID', 'Resolve texture/material/mesh/prefab/etc.'],
        ['EntityRef', 'Scene-local entity handle', 'ResolveEntityRef then safely query components'],
        ['ScriptableObject subclass', 'Referenced data asset', 'Load/use immutable-style configuration'],
        ['std::vector<T>', 'JSON array', 'Inspector lists; drag into list appends a new item'],
        ['Primitives / GLM values', 'JSON scalar/object', 'Direct authoring values']
      ] },
      { type: 'callout', tone: 'warning', title: 'Prefabs and overrides', text: 'A prefab is a serialised entity hierarchy. A scene instance maintains its source link and local overrides. Prefer applying deliberate edits to the prefab or reverting instance overrides; avoid editing the generated serialised file by hand while the editor is open.' }
    ]
  },
  {
    id: 'audio-save-debug', group: 'Game APIs', title: 'Audio, persistence, time and debugging',
    summary: 'Small game services available to Behaviour code.',
    tags: ['audio', 'save', 'debug', 'time', 'random'],
    blocks: [
      { type: 'code', language: 'cpp', code: 'AudioSource source(GetEntity());\nif (source) {\n    source.SetVolume(0.75f);\n    source.Play();\n}\n\nnlohmann::json save = { {"bestScore", 1200} };\nSaveSystem::SaveJson("save/game.json", save);\nDebug::Log("frame " + std::to_string(Time::FrameCount()));' },
      { type: 'list', items: ['AudioSource controls the AudioSourceComponent owned by an entity: Play, Stop, Pause, UnPause, volume and IsPlaying.', 'AudioEngine is lower level host-side playback with AudioHandle values, suitable for engine systems.', 'SaveSystem saves/loads JSON. Treat reads as untrusted: missing or malformed files produce an empty JSON object.', 'Debug::Log, LogWarning, LogError and Assert route to the editor/player console.', 'Time exposes frame/time state; Mathf and Random provide lightweight common helpers.'] },
      { type: 'callout', tone: 'info', title: '3DS lifecycle', text: 'Save on meaningful checkpoints and respond to OnApplicationPause/OnApplicationQuit. HOME, sleep and power transitions are controlled by APT, not a conventional desktop window close event.' }
    ]
  },
  {
    id: 'three-ds-runtime', group: 'Nintendo 3DS', title: '3DS runtime model',
    summary: 'Frame ownership, dual screens, APT lifecycle and hardware constraints.',
    tags: ['3ds', 'apt', 'hid', 'citra', 'performance'],
    blocks: [
      { type: 'paragraph', text: 'The 3DS is not a reduced desktop. It has a 400×240 stereoscopic top display, a 320×240 resistive touch lower display, restricted linear/VRAM memory and a stateful PICA200 GPU. Keep gameplay systems platform-neutral; isolate a hardware API behind an engine service or package adapter.' },
      { type: 'table', headers: ['Concern', 'Engine policy'], rows: [
        ['Frame loop', 'DualityPlayer owns aptMainLoop, input sampling, rendering frame begin/end and VBlank/presentation.'],
        ['Display routing', 'Camera Screen chooses Top or Bottom. Bottom is the touch UI/gameplay target.'],
        ['Suspend / HOME', 'APT maps platform lifecycle to Behaviour application callbacks. Never run gameplay work inside a raw APT hook.'],
        ['Memory', 'Use cooked .t3x textures and unload scene resources; avoid duplicate 2D/3D GPU caches when possible.'],
        ['Performance', 'Prefer sprites, atlases, modest mesh count and stable render state. Measure draw calls in the Game panel.']
      ] },
      { type: 'callout', tone: 'warning', title: 'Platform code belongs below gameplay', text: 'A game may expose a feature-oriented service (for example Device::IsNew3DS or LocalWireless) but should not place #include <3ds.h> throughout Behaviour files. This preserves desktop testability and makes an eventual multiplayer implementation replaceable.' }
    ]
  },
  {
    id: 'citro3d-libctru', group: 'Nintendo 3DS', title: 'Citro3D and libctru reference',
    summary: 'The raw native APIs Duality builds on, their lifecycle, ownership and safe integration points.',
    tags: ['citro3d', 'libctru', 'c3d', 'hid', 'apt', 'tex3ds'],
    blocks: [
      { type: 'callout', tone: 'warning', title: 'Engine-level API', text: 'These APIs are not ordinary game API. Citro3D owns global GPU state. A package that calls C3D_FrameBegin/End or destroys a renderer target will corrupt Duality rendering. Add a narrow engine extension point instead.' },
      { type: 'table', headers: ['Subsystem', 'Core calls', 'Ownership rule'], rows: [
        ['Application (APT)', 'aptMainLoop, aptHook, aptSetSleepAllowed', 'DualityPlayer owns the loop; forward lifecycle only.'],
        ['Input (HID)', 'hidScanInput, hidKeysHeld/Down/Up, hidTouchRead', 'InputManager samples exactly once per frame.'],
        ['GPU frame', 'C3D_Init, C3D_FrameBegin, C3D_FrameEnd, C3D_Fini', 'Process-global; player owns Init/Fini and one bracket per frame.'],
        ['Render target', 'C3D_RenderTargetCreate, SetOutput, Clear, FrameDrawOn', 'Citro2D creates shared screen targets; Citro3D receives non-owning pointers.'],
        ['Shader / geometry', 'DVLB_ParseFile, shaderProgramInit/SetVsh/Free, BufInfo_Add, C3D_DrawArrays', 'Renderer owns DVL, shader and linear vertex allocations.'],
        ['Texture', 'Tex3DS_TextureImport, C3D_TexBind, C3D_TexDelete', 'Backend cache owns C3D_Tex lifetime; texture ID 0 means none.']
      ] },
      { type: 'code', language: 'cpp', code: '// Conceptual engine-owned frame. Do not duplicate this in a game package.\nwhile (aptMainLoop()) {\n    hidScanInput();\n    InputManager::BeginFrame();\n    // map hid state -> InputManager\n\n    C3D_FrameBegin(C3D_FRAME_SYNCDRAW);\n    RenderScreen(renderer2D, renderer3D, scene, Screen::Top, clear);\n    RenderScreen(renderer2D, renderer3D, scene, Screen::Bottom, clear);\n    C3D_FrameEnd(0);\n}' },
      { type: 'list', items: ['C3D_Init(commandBufferBytes) creates Citro3D global state; C3D_Fini releases it after all renderer resources are destroyed.', 'C3D_FrameBegin flags choose draw synchronisation; C3D_FrameEnd finalises commands and schedules transfer/presentation.', 'C3D_RenderTargetCreate(width, height, colourFormat, depthFormat) allocates a render target. C3D_RenderTargetSetOutput routes it to GFX_TOP/GFX_BOTTOM and eye side.', 'C3D_RenderTargetClear clears colour/depth/stencil; C3D_FrameDrawOn makes a target current before draw calls.', 'C3D_FVUnifMtx4x4 and C3D_FVUnifSet set vertex uniform registers. C3D_AttrInfoInit and AttrInfo_Add describe shader attributes; BufInfo_Add supplies vertex buffer layout.', 'linearAlloc/linearFree are appropriate for GPU-visible linear allocations; pairs must be exact and renderer-owned.', 'Tex3DS converts/imports cooked .t3x data into C3D_Tex. The build cooker therefore converts images; raw JPG/PNG should not be assumed to be loadable at runtime.', 'Display transfer flags control output scaling/filtering and are where the build anti-aliasing setting is applied.'] },
      { type: 'paragraph', text: 'Raw header coverage is intentionally grouped by subsystem here instead of copying every devkitPro declaration. Follow the linked official references from the Resources panel for exhaustive symbol-level declarations and verify against the devkitPro version installed with the build toolchain.' }
    ]
  },
  {
    id: 'build-deploy', group: 'Nintendo 3DS', title: 'Build, cook and deploy',
    summary: 'From Build Settings to 3DSX/CIA output without cooking the entire project.',
    tags: ['build', 'cook', '3dsx', 'cia', 'romfs', 'icon'],
    blocks: [
      { type: 'list', items: ['Build Settings stores Scenes In Build and Start Scene in the .dproj. The top scene is also the fallback start scene for older projects.', 'The asset cook starts from included scenes and follows serialised AssetRef dependencies. It should not recursively package every file under Assets.', 'Image assets are converted to the hardware runtime format (.t3x) by the cook stage; import settings control resize/filtering policy.', '3DSX is suitable for Homebrew Launcher/Citra testing. CIA packaging additionally requires valid metadata and a 48×48 icon for the SMDH icon input.', 'The build launcher detects DEVKITPRO. Use the devkitPro MSYS environment/toolchain consistently; mixing unrelated MinGW/MSYS compilers into an existing CMake cache causes standard-library/include failures.'] },
      { type: 'callout', tone: 'warning', title: 'Build failure triage', text: '“Image must be exactly 48 x 48” is SMDH icon validation, not a scene/render error. “Could not open file” during 3DSX packaging usually points at a tool input/output path; inspect the command just above it before changing editor source paths.' }
    ]
  },
  {
    id: 'editor-workflow', group: 'Editor', title: 'Editor workflow and shortcuts',
    summary: 'Scenes, hierarchy, content browser, inspector and safe authoring workflow.',
    tags: ['editor', 'hierarchy', 'content browser', 'undo', 'prefab'],
    blocks: [
      { type: 'table', headers: ['Area', 'Core behaviour'], rows: [
        ['Hierarchy', 'Right-click create/remove entities; drag to parent/reorder; Delete removes selected entities; Ctrl+D duplicates.'],
        ['Scene panel', 'Top/Bottom 2D and 3D authoring views. 2D is an editing aid, not a different render system; sprites remain drawable in 3D views as quads. The 3D pane evaluates VertexLit and projected blob shadows with its free editor camera, and draws camera/light gizmos as overlays.'],
        ['Content Browser', 'Resizable tree at left shows assets/packages and files; grid at right supports multi-select, drag/drop, Ctrl+D and direct scene drops.'],
        ['Inspector', 'Shows components, reflected fields, text/code preview and prefab connection/overrides. Dragging into a reflected list appends an item.'],
        ['Undo/redo', 'Ctrl+Z / Ctrl+Y track editor mutations where supported. Save scenes explicitly after authoring.']
      ] },
      { type: 'paragraph', text: 'Drag an image onto a Scene panel to create a SpriteRenderer, or an UIImage when the target is Canvas UI. Drag a prefab to instantiate it. Drag an entity to Content Browser to create a prefab. Use the scene mode best suited to manipulation, but validate final camera framing in Game panel.' },
      { type: 'callout', tone: 'info', title: 'Editor versus runtime', text: 'Use a custom scripting define only for project-level variants. Built-in DUALITY_PLATFORM_DESKTOP and DUALITY_PLATFORM_3DS identify compilation target. An EDITOR define should not accidentally gate code that must exist in the hardware build.' }
    ]
  },
  {
    id: 'render-pipeline-design', group: 'Future architecture', title: '3DS lighting and render pipeline design',
    summary: 'A forward-rendering roadmap for adding light and shadows without turning Duality into a desktop-only renderer.',
    tags: ['proposal', 'renderer', 'lighting', 'shadow', '3ds'],
    blocks: [
      { type: 'callout', tone: 'info', title: 'Design document with an implemented first slice', text: 'Unlit, one directional VertexLit path and the opt-in projected blob-shadow tier are now implemented. This page remains the design boundary for point lights, queues, culling and shadow maps; those follow-up features are not implied by the first slice.' },
      { type: 'paragraph', text: 'Duality should use a small forward pipeline on both desktop and Nintendo 3DS. A frame renders meshes first, then sprites, then Canvas UI into the same physical screen target. Lighting applies only to opt-in 3D materials; SpriteRenderer, UIImage, UIText and UIButton remain unlit so existing 2D games keep their exact visual behaviour.' },
      { type: 'table', headers: ['Rejected approach', 'Why it does not fit 3DS', 'Chosen alternative'], rows: [
        ['Deferred rendering', 'Several G-buffers consume VRAM and fill rate; lighting would require an additional fullscreen pass.', 'Single forward mesh pass with bounded light data.'],
        ['PBR with many maps', 'Material texture bandwidth and shader complexity are excessive for PICA200.', 'Albedo texture/color plus ambient, Lambert diffuse and optional low-cost specular.'],
        ['Unlimited dynamic lights', 'Per-object/per-vertex work becomes unpredictable and impossible to budget.', 'One directional light and a capped, camera-selected point-light list.'],
        ['Shadow maps as baseline', 'Extra depth target, render pass and filtering are costly and fragile on Old 3DS.', 'Blob/contact shadows first; baked/static lighting second; shadow maps remain experimental.']
      ] },
      { type: 'paragraph', text: 'The central rule is that the scene renderer owns rendering decisions, while platform backends own GPU implementation. Game scripts author Lights and Materials; they never call Citro3D frame APIs or manage C3D render targets.' },
      { type: 'code', language: 'cpp', code: '// RenderView exists now; PointLightData remains proposed.\nstruct DirectionalLightData {\n    bool Enabled = false;\n    glm::vec3 Direction; // shaded point -> light\n    glm::vec3 Color{ 1.0f };\n    float Intensity = 1.0f;\n    bool CastShadows = false;\n};\n\nstruct RenderView {\n    CameraData Camera;\n    glm::vec3 AmbientColor;\n    DirectionalLightData MainLight;\n    std::array<PointLightData, 4> PointLights; // later\n    uint32_t PointLightCount = 0;\n};' },
      { type: 'list', items: ['Build a RenderView once for every enabled primary camera and physical screen.', 'Collect mesh draw items only after layer/culling-mask filtering and frustum culling.', 'Resolve material and mesh assets before sorting; opaque items sort front-to-back to improve depth rejection.', 'Transparent mesh items sort back-to-front. They do not write depth, but still depth-test.', 'Bind only the state needed by each draw; Citro2D/Citro3D global state must be re-established at pipeline boundaries.', 'End the mesh pass before beginning the existing 2D sprite and UI passes.'] },
      { type: 'callout', tone: 'success', title: 'Compatibility promise', text: 'An existing .mat missing all new fields remains Unlit and therefore keeps today’s Color + Texture result. Existing scenes and cooked assets must load without migration errors.' }
    ]
  },
  {
    id: 'render-pipeline-implementation', group: 'Future architecture', title: 'Forward renderer implementation status',
    summary: 'The implemented foundation, compatibility rules and backend work remaining for VertexLit.',
    tags: ['renderer', 'forward', 'vertex-lit', 'material', 'citro3d', 'implementation'],
    blocks: [
      { type: 'callout', tone: 'info', title: 'Current milestone', text: 'The first forward-lighting vertical slice is implemented: MaterialShadingMode (Unlit or VertexLit), DirectionalLightComponent, object-space MeshVertex normals, RenderView and MeshDrawCommand submission, desktop GLSL Lambert/Gouraud lighting, an equivalent PICA vertex-shader path, and opt-in directional projected blob shadows on Plane receivers. Point lights, queues/frustum culling and shadow maps remain later milestones.' },
      { type: 'heading', text: 'Compatibility contract' },
      { type: 'table', headers: ['Existing content', 'Load behaviour', 'Reason'], rows: [
        ['Old .mat without Shading Mode', 'Loads as Unlit', 'Unlit is the Material default, preserving legacy Color + Texture output.'],
        ['OBJ with positions/UVs but no normals', 'Receives a generated flat normal per triangle', 'Old assets become usable by VertexLit without a migration step.'],
        ['Sprites, particles and Canvas UI', 'Remain on their existing unlit 2D path', 'Lighting is a 3D mesh-pass feature, never a change to gameplay/UI appearance.'],
        ['Directional Light: Cast Shadows', 'Opt-in projected blob shadows on active Plane receivers', 'A hardware-safe transparent quad is projected along the light ray after opaque meshes; it is not a shadow map.']
      ] },
      { type: 'heading', text: 'Data model' },
      { type: 'code', language: 'cpp', code: 'enum class MaterialShadingMode { Unlit, VertexLit };\n\nstruct Material {\n    glm::vec4 Color{ 1.0f };\n    AssetRef Texture;\n    // Last: preserves Material{ color, texture } source compatibility.\n    MaterialShadingMode ShadingMode = MaterialShadingMode::Unlit;\n};\n\nstruct DirectionalLightComponent {\n    bool Enabled = true;\n    glm::vec3 Color{ 1.0f };\n    float Intensity = 1.0f;\n    bool CastShadows = false; // enables the projected blob tier\n};\n\nstruct MeshVertex {\n    glm::vec3 Position;\n    glm::vec2 TexCoord;\n    glm::vec3 Normal; // object space\n};' },
      { type: 'paragraph', text: 'A DirectionalLightComponent direction is derived from the entity world rotation. SceneRenderer, not scripts or a backend, selects the first active enabled directional light in canonical scene-hierarchy order for a camera RenderView. This makes main-light selection reproducible even when EnTT component-storage order changes. The editor’s free Scene camera calls that same selection helper, so its 3D preview matches Game lighting without modifying a gameplay camera. Materials stay reusable assets; a future per-renderer MaterialInstance will carry runtime parameter overrides, rather than adding a Color field to MeshRendererComponent.' },
      { type: 'heading', text: 'Authoring the first lit mesh' },
      { type: 'list', items: ['Create or select a .mat asset and change Shading Mode from Unlit to VertexLit. This opt-in is required; legacy/default materials stay unlit.', 'Add a Directional Light component to an active scene entity. Its entity rotation controls direction; Color and Intensity control the selected main light.', 'To enable the current shadow tier, enable Cast Shadows on that selected directional light and place an active Plane primitive below the caster. The renderer projects a translucent blob along the light ray; this low-cost tier is not a shadow map.', 'Use a mesh with normals. Built-in Cube, Sphere, Plane and Capsule provide them; imported OBJ assets without vn records receive generated flat triangle normals.', 'For the initial 3DS VertexLit tier, use uniform mesh scale. Desktop handles non-uniform scale with a normal matrix; PICA support for it is intentionally deferred rather than silently producing misleading lighting.'] },
      { type: 'heading', text: 'Submission design' },
      { type: 'code', language: 'text', code: 'SceneRenderer\n  collect active, layer-visible mesh entities\n  -> resolve mesh + material assets\n  -> build one RenderView per primary camera\n  -> opaque front-to-back / transparent back-to-front\n  -> IRenderer3D backend draw commands\n\nOpenGLRenderer3D: GLSL shader variants\nCitro3DRenderer : engine-owned .v.pica shader + TexEnv / vertex-uniform state' },
      { type: 'list', items: ['RenderView carries camera/projection state, ambient colour and the selected main directional light. It is platform-neutral and is built once per camera pass.', 'RenderItem carries already-resolved GPU mesh/texture handles plus material parameters. Asset GUID resolution never moves into a backend.', 'Unlit remains a separate stable shader variant. VertexLit uses Gouraud lighting: ambient plus clamped Lambert diffuse at vertices.', 'The blob-shadow pass follows opaque meshes and precedes sprites; it submits transparent, depth-read-only Plane quads. Point lights, general transparent queues and frustum culling remain follow-up milestones.'] },
      { type: 'heading', text: 'Backend policy' },
      { type: 'table', headers: ['Backend', 'Shader source', 'Lighting route', 'Important constraint'], rows: [
        ['Desktop OpenGL', 'GLSL #version 130', 'Renderer computes and uploads the inverse-transpose normal matrix; the vertex shader evaluates the shared VertexLit semantic.', 'Keeping inverse() out of GLSL 1.30 preserves the editor compatibility profile. Uniform uploads use their exact GLSL type (vec3 via glUniform3f); using glUniform4f for a vec3 is GL_INVALID_OPERATION and leaves lighting black.'],
        ['Nintendo 3DS / PICA200', 'Picasso-compiled .v.pica assembly', 'Vertex shader transforms normals and evaluates ambient plus Lambert diffuse; Citro3D transforms the world light direction into view space before upload, then TexEnv modulates primary color with albedo.', 'PICA200 does not accept GLSL/HLSL runtime shaders; initial VertexLit documents uniform-scale meshes only.'],
        ['Game scripts', 'No shader source', 'Author material and light component data only.', 'Scripts never call C3D_FrameBegin/End, bind render targets or allocate GPU memory.']
      ] },
      { type: 'paragraph', text: 'The Citro3D implementation follows the proven fragment_light and normal_mapping references: configure position/UV/normal attributes, bind shader/attribute/buffer state explicitly at the mesh-pass boundary, use renderer-owned linear allocations, and release DVL/program/textures exactly once at shutdown.' },
      { type: 'heading', text: 'Verification' },
      { type: 'list', items: ['Material loader regression: VertexLit serialises and deserialises; missing Shading Mode remains Unlit. MaterialLoader::SetRuntime updates only the process-local cache.', 'Mesh loader regression: authored OBJ vn normals survive import; a position/UV-only OBJ gets a non-zero generated triangle normal; each built-in primitive exposes non-zero normalized normals.', 'Scene serializer regression: DirectionalLightComponent colour, intensity and CastShadows field round-trip.', 'RenderView regression: camera state is preserved, disabled directional lights are skipped, and the selected main-light direction/parameters are deterministic by hierarchy order.', 'Blob-shadow regression: a cube above one Plane receiver emits one transparent depth-read-only Plane command at the receiver.', 'Run the desktop suite through run-tests.bat so the devkitPro runtime DLL path is present. The current suite has 75 passing tests after runtime material overrides landed.', 'Picasso regression: build the mesh_shader target in the 3DS build tree; the PICA VertexLit shader must compile before a device package is produced.', 'Before declaring VertexLit supported on device, run a Citra and real Old 3DS scene with both screens active, a textured mesh, an untextured mesh, no light, a rotated light and non-uniform scale.'] },
      { type: 'callout', tone: 'warning', title: 'Current shadow boundary', text: 'Cast Shadows now activates only the projected blob tier: non-plane meshes project onto active Plane primitives after opaque rendering, with alpha blending and depth writes disabled. It deliberately does not claim arbitrary mesh receivers, self-shadowing, light cookies or shadow-map fidelity.' },
      { type: 'callout', tone: 'warning', title: 'Do not skip the RenderView boundary', text: 'Passing a light colour or material tint directly through MeshRenderer would couple scene policy to a component and cannot scale to culling, material instances or bounded point lights. Build RenderView and RenderItem first, then make backends consume those values.' }
    ]
  },
  {
    id: 'lighting-data-model', group: 'Future architecture', title: 'Proposed lights, materials and mesh data',
    summary: 'The serialised component and asset model required for controllable, portable vertex lighting.',
    tags: ['proposal', 'material', 'directional light', 'point light', 'normal'],
    blocks: [
      { type: 'paragraph', text: 'The first rendering milestone needs normals before it needs shadows. The implemented OBJ importer reads positions, UVs and vn normal data; when vn is absent it creates stable flat triangle normals. MeshVertex, procedural primitives, desktop backend and Citro3D backend now share the same object-space normal attribute, including PICA attribute v2.' },
      { type: 'table', headers: ['New authoring type', 'Essential fields', 'Notes'], rows: [
        ['Material', 'ShadingMode, Color, Texture, AmbientStrength, SpecularStrength, Shininess, ReceiveShadows', 'ShadingMode defaults to Unlit for backward compatibility.'],
        ['DirectionalLightComponent', 'Enabled, Color, Intensity, CastShadows', 'Direction derives from entity transform; exactly one main light selected per RenderView.'],
        ['PointLightComponent', 'Enabled, Color, Intensity, Range', 'The renderer selects the nearest useful lights; no promise that every point light affects every mesh.'],
        ['MeshVertex', 'Position, TexCoord, Normal', 'Normal is object-space and shared by imported and procedural meshes.'],
        ['RenderSettings', 'AmbientColor, LightingQuality, MaxPointLights, ShadowMode', 'Project-level policy, with platform/build overrides.']
      ] },
      { type: 'code', language: 'cpp', code: 'enum class MaterialShadingMode { Unlit, VertexLit };\n\nstruct DirectionalLightComponent {\n    bool Enabled = true;\n    glm::vec3 Color{ 1.0f };\n    float Intensity = 1.0f;\n    bool CastShadows = false; // Reserved until a shadow mode is implemented.\n};\n\nstruct PointLightComponent {\n    bool Enabled = true;\n    glm::vec3 Color{ 1.0f };\n    float Intensity = 1.0f;\n    float Range = 4.0f;\n};' },
      { type: 'paragraph', text: 'Lit materials use vertex (Gouraud) lighting, not per-pixel lighting. For each vertex the renderer combines ambient with a clamped Lambert dot product between normal and light direction; interpolation then happens naturally across the triangle. This is visually effective for low-poly meshes, reliable on PICA200 and maps cleanly to the desktop shader.' },
      { type: 'list', items: ['Imported OBJ files with vn data preserve authored normals.', 'OBJ files without normals generate one face normal per triangle initially; smoothing groups are a later importer enhancement.', 'Procedural cube uses hard face normals; plane uses a fixed up normal; sphere uses normalized local position.', 'Non-uniform scale needs a normal matrix on desktop. The first 3DS path should document approximate normal handling or disallow non-uniform scale for VertexLit objects until it is correct.', 'Point lights use a distance attenuation curve with an explicit Range cutoff so their influence is bounded and deterministic.'] },
      { type: 'callout', tone: 'warning', title: 'No gameplay API in phase one', text: 'Lights are authoring components first. A script wrapper can follow after renderer behaviour is stable; it should configure component data, never issue immediate draw calls.' }
    ]
  },
  {
    id: 'shadow-quality-roadmap', group: 'Future architecture', title: 'Shadow quality tiers and 3DS budget',
    summary: 'A staged shadow plan with useful visuals at each step and clear stop conditions for Old 3DS.',
    tags: ['proposal', 'shadow', 'performance', 'build settings', 'old 3ds'],
    blocks: [
      { type: 'paragraph', text: 'Shadows should be a quality feature, not a renderer prerequisite. The game’s baseline must work in Unlit and VertexLit modes. The implemented blob tier is deliberately opt-in through Directional Light > Cast Shadows; each higher tier remains optional and has a well-defined visual payoff, memory cost and test target.' },
      { type: 'table', headers: ['Tier', 'Technique', 'Cost / benefit', 'Initial status'], rows: [
        ['Unlit', 'Current Color + Texture material path', 'Cheapest; exact compatibility mode.', 'Existing baseline'],
        ['VertexLit', 'Ambient + directional/selected point lights at vertex level', 'Strong form readability with no extra render target.', 'First implementation milestone'],
        ['VertexLit + Blob', 'Translucent projected quad from non-Plane meshes onto active Plane receivers', 'Very low cost contact cue; no depth map. Enable Directional Light > Cast Shadows.', 'Implemented baseline'],
        ['Baked static', 'Lightmap or baked vertex colors for environment', 'Excellent quality/runtime cost trade-off for static levels.', 'Design/import pipeline milestone'],
        ['Shadow map', 'Low-resolution directional depth pass', 'High complexity/VRAM; requires filtering and projection management.', 'Experimental, disabled by default']
      ] },
      { type: 'paragraph', text: 'Blob shadows are implemented as a controlled renderer feature, not as a one-off sprite in every prefab. The current policy treats active non-Plane MeshRenderer entities as casters and active Plane primitives as receivers; it projects a translucent, depth-read-only quad after opaque meshes. A future ShadowCasterComponent can add enabled, local offset, radius, opacity and ground-layer controls without changing the pass boundary.' },
      { type: 'code', language: 'cpp', code: 'enum class LightingQuality {\n    Unlit,\n    VertexLit,\n    VertexLitBlobShadows\n};\n\n// Proposed Build Settings / Project Settings data.\nstruct RenderSettings {\n    LightingQuality Lighting = LightingQuality::VertexLit;\n    glm::vec3 AmbientColor{ 0.18f };\n    int MaxPointLights = 4; // Clamp to the hardware-safe budget.\n};' },
      { type: 'list', items: ['Expose Lighting Quality in Project Settings and permit a 3DS Build Settings override. Anti-aliasing/display-transfer selection stays independent.', 'Old 3DS validation uses the lowest supported lighting tier, normal gameplay scene, worst-case light overlap and both screens active.', 'New 3DS may raise a documented point-light cap only after profiling; game content must never depend on that higher cap.', 'Show renderer diagnostics in editor: mesh draw calls, visible mesh count, culled count, selected point lights, blob shadow count and estimated texture/linear-memory usage.', 'Use Citra for iteration, then verify frame time and memory on real Old 3DS hardware before declaring a tier supported.'] },
      { type: 'callout', tone: 'warning', title: 'Shadow-map gate', text: 'Do not start a shadow-map implementation until vertex lighting, RenderView, render queues, frustum culling and blob shadows are stable and measured. If static/baked lighting answers the game’s visual need, shadow maps should remain unnecessary.' }
    ]
  },
  {
    id: 'multiplayer-3ds-design', group: 'Future architecture', title: 'Multiplayer and Nintendo 3DS network design',
    summary: 'A local-first networking architecture, protocol and implementation roadmap before any transport enters the engine.',
    tags: ['proposal', 'multiplayer', 'uds', 'udp', 'replication'],
    blocks: [
      { type: 'callout', tone: 'warning', title: 'Design document — not implemented yet', text: 'Duality currently has no transport, lobby, replication or Network component. The existing application lifecycle callbacks are the only networking-adjacent runtime surface; every class and API below is proposed design, not callable code.' },
      { type: 'table', headers: ['Principle', 'Decision'], rows: [
        ['Gameplay is transport-agnostic', 'Scripts use session, peer, messages and game state. They never include <3ds.h>, UDS or BSD socket headers.'],
        ['Local-first', '3DS UDS local wireless is the first milestone. Internet/UDP is a separate transport, not an extension of UDS.'],
        ['Host authoritative', 'Clients send input/intent; host validates hits, simulation, spawns, scores and the authoritative snapshot.'],
        ['No raw ECS on the wire', 'Never send entt::entity handles, pointers, std::string memory layout or memcpy of a C++ struct.'],
        ['No blocked frame', 'Scan, receive, resend and reconnect are poll/tick operations with strict packet budgets.'],
        ['Desktop before device', 'The same session and codec run through Loopback first, then desktop UDP, before two-device tests.']
      ] },
      { type: 'code', language: 'text', code: 'GameScripts / Behaviour\n    │  gameplay messages, input, presentation\n    ▼\nNetworkSession             // portable lobby, peers, reliability state\n    ├── PacketCodec         // versioned message <-> byte encoding\n    ├── ReplicationSystem   // later: commands, snapshots, interpolation\n    ▼\nINetworkTransport          // Host, Scan, Join, Send, Poll, Leave\n    ├── UdsTransport        // 3DS local wireless\n    ├── UdpTransport        // desktop + 3DS Wi-Fi / Internet\n    └── LoopbackTransport   // deterministic test transport' },
      { type: 'paragraph', text: 'DualityEngine/Network should contain the portable codec, session state and transport interface. Only the 3DS platform implementation may include <3ds.h> and call UDS/SOC. This is the same boundary used by input: the host reads HID while game scripts consume a high-level API.' },
      { type: 'code', language: 'cpp', code: '// Proposed only — not implemented.\nclass NetworkSession {\npublic:\n    NetworkState GetState() const;\n    bool Host(const LobbyConfig& config);\n    bool Join(const LobbyInfo& lobby);\n    void Send(PeerId peer, MessageType type, ByteSpan bytes, Delivery delivery);\n    void Tick(float deltaTime);\n};' },
      { type: 'table', headers: ['UDS phase', 'libctru primitive', 'Engine responsibility'], rows: [
        ['Lifetime', 'udsInit / udsExit', 'UdsTransport owns shared memory and an idempotent lifetime.'],
        ['Host', 'udsGenerateDefaultNetworkStruct, udsCreateNetwork', 'Create a lobby and bind a data channel.'],
        ['Discover / join', 'udsScanBeacons, udsConnectNetwork', 'Poll scan results and version-gate before joining.'],
        ['Data', 'udsSendTo, udsPullPacket', 'Pass bounded byte packets to PacketCodec; cap packets per frame.'],
        ['Peer status', 'udsGetConnectionStatus', 'Emit PeerJoined and PeerLeft once per actual transition.'],
        ['Leave', 'udsDestroyNetwork / udsDisconnectNetwork / udsUnbind', 'Safe to call repeatedly during leave, pause and quit.']
      ] },
      { type: 'callout', tone: 'info', title: 'UDS is not a script API', text: 'udsSendTo only understands bytes. NetworkSession decides which peer is valid, which delivery policy applies and which gameplay callback is allowed to run on the main thread.' },
      { type: 'paragraph', text: 'Online mode does not use UDS. UdpTransport owns the aligned socInit buffer on 3DS and non-blocking BSD UDP sockets; desktop provides an equivalent implementation. NAT traversal, relay infrastructure, accounts, authentication and matchmaking are external services, not a handful of engine functions.' },
      { type: 'code', language: 'text', code: 'magic:u16 | protocolVersion:u8 | channel:u8 | sessionId:u16 |\nsequence:u16 | ack:u16 | ackBits:u32 | payloadLength:u16 | payload:bytes' },
      { type: 'list', items: ['Unreliable sequenced is for newest input and transform snapshots; older packets may be discarded.', 'Reliable ordered is for lobby state, spawn/despawn, inventory and scene transitions.', 'Protocol/build/content hashes gate a connection before gameplay packets are accepted.', 'Packet length and packets-per-frame have hard caps; reject invalid lengths before allocation or parsing.', 'Replicate input commands and host snapshots, not TransformComponent state every frame. Spawn messages map prefab ID plus network ID, never an Entity handle.'] },
      { type: 'table', headers: ['Lifecycle event', 'NetworkSession action'], rows: [
        ['OnApplicationPause(true)', 'Stop input transmission, enter Suspended, mark transport stale and save a checkpoint if appropriate.'],
        ['OnApplicationPause(false)', 'Re-scan/reconnect through the state machine; resume only after host confirmation.'],
        ['OnApplicationQuit()', 'Best-effort leave, then idempotent cleanup. Never wait on a network operation.'],
        ['Disconnect / timeout', 'Transition to Offline or reconnect flow; gameplay receives a single clear state event.']
      ] },
      { type: 'code', language: 'text', code: 'Offline\n  ├─ Host() ─────────────► Hosting ─► InGame ─► Leaving ─► Offline\n  └─ Scan() ─► Discovering ─► Joining ─► Lobby ─► InGame\n                         │        │          │\n                         └────────┴──────────┴─ error / timeout ─► Offline\n\nSuspended is an overlay state: no gameplay packets are sent until reconnect succeeds.' },
      { type: 'list', items: ['Foundation: bounds-checked ByteWriter/ByteReader, versioned codec, LoopbackTransport and loss/reorder tests.', 'UDS lobby: host, scan, join, leave and peer status — no scene replication yet.', 'Message layer: reliable/unreliable channels, acknowledgement/retry, packet budgets and console metrics.', 'Vertical slice: two players, client input command, host snapshot, disconnect and rejoin.', 'UDP direct IP: retain the session/codec and replace only the transport.', 'Prediction, reconciliation and online backend only after real-device profiling and stable reconnect behaviour.'] },
      { type: 'callout', tone: 'success', title: 'Starting decision', text: 'When implementation begins, build one host-authoritative UDS local-wireless demo game mode first. Add UDP only after the exact same session, codec and gameplay authority flow is reliable on two real devices.' }
    ]
  },
  {
    id: 'renderer-deep-dive', group: 'Engine systems', title: 'Renderer deep dive: frame, passes and resource ownership',
    summary: 'The exact responsibilities of SceneRenderer, IRenderer backends, cameras, materials and GPU caches in the current engine.',
    tags: ['renderer', 'scene renderer', 'camera', 'material', 'gpu cache'],
    blocks: [
      { type: 'heading', text: 'Scope and invariants' },
      { type: 'paragraph', text: 'This page describes the renderer that exists today, not the proposed lighting pipeline. The same SceneRenderer path is used by DualityPlayer and the editor Game panel. Platform code changes how draw calls reach the GPU, but it must not change scene visibility, material resolution or screen routing decisions.' },
      { type: 'table', headers: ['Layer', 'Owns', 'Must not own'], rows: [
        ['SceneRenderer', 'Scene traversal, effective activity, camera/layer filtering, asset resolution, sort policy and pass order.', 'Window, C3D frame lifetime, raw GPU allocation or game input.'],
        ['IRenderer2D / IRenderer3D', 'Backend resource handles, drawing state and draw-call counters.', 'Asset GUID resolution, scene hierarchy policy or script state.'],
        ['Citro2DRenderer / Citro3DRenderer', '3DS-specific GPU state and cached C3D resources.', 'C3D_FrameBegin/C3D_FrameEnd ownership; that stays in the player main loop.'],
        ['MaterialLoader / AssetDatabase', 'Material JSON and GUID-to-path resolution; process-local runtime material overrides.', 'GPU residency; a renderer loads the resolved path into its own cache.'],
        ['Editor Scene panel', 'Free editor camera, picking and gizmos.', 'A different gameplay renderer; Game panel remains the truth for final composition. Camera body/frustum and directional-light sun/ray gizmos are editor overlays only.']
      ] },
      { type: 'callout', tone: 'info', title: 'One scene, two physical screens', text: 'Top and Bottom are not separate Scene instances. A CameraComponent chooses its Screen; EntityLayer and the camera CullingMask decide whether an entity is eligible. The renderer evaluates this for each screen every frame.' },
      { type: 'heading', text: 'Per-frame and per-screen sequence' },
      { type: 'code', language: 'text', code: 'DualityPlayer main loop\n  ├─ aptMainLoop / HID sample / runtime update\n  ├─ C3D_FrameBegin(...)                         // 3DS only, once\n  ├─ RenderScreen(..., Top)\n  │    ├─ choose active primary camera\n  │    ├─ RenderScreen3D: clear + opaque VertexLit/Unlit meshes\n  │    ├─ projected blob-shadow pass (if Cast Shadows)\n  │    ├─ 2D sprite/flipbook/line pass\n  │    └─ Canvas UI pass\n  ├─ RenderScreen(..., Bottom)\n  │    └─ same ordered passes, distinct target\n  └─ C3D_FrameEnd(...)                           // 3DS only, once' },
      { type: 'list', items: ['A physical screen can draw both meshes and sprites in a single frame. ProjectionType changes the 3D camera lens, not whether 2D or 3D content exists.', 'The mesh pass clears first and owns depth. Sprite and UI passes compose over it; they do not participate in mesh depth testing.', 'A missing primary camera makes the 3D mesh pass a no-op. UI may still render because Canvas has its own fixed screen-space rule.', 'A camera background color overrides the caller fallback clear color. The screen is cleared exactly once even though multiple passes may target it.', 'Citro2D and Citro3D mutate shared global C3D state. Each backend rebinds the program/pipeline state it needs at its own BeginScene or Draw call boundary.'] },
      { type: 'heading', text: 'Camera, layer and visibility resolution' },
      { type: 'paragraph', text: 'SceneRenderer first identifies the primary enabled camera for a Screen. It reads the camera world transform, projection fields, near/far planes, FOV or orthographic zoom, background and culling mask. It then calls ShouldRenderOnScreen for each candidate entity. That test combines effective hierarchy activity, inherited Top/Bottom layer routing and the camera mask; it is the only place a renderer should decide screen visibility.' },
      { type: 'table', headers: ['Authoring value', 'Runtime consequence', 'Common mistake'], rows: [
        ['Camera.Screen', 'Routes a camera view to Top or Bottom target.', 'Expecting one camera to render both displays. Use two cameras when views differ.'],
        ['Camera.Primary', 'Selects the active camera for that screen.', 'Leaving several primary cameras and assuming render order defines the result.'],
        ['EntityLayer TOP/BOTTOM', 'Excludes an entity from the other physical screen, including children through hierarchy rules.', 'Using sort order to route objects between physical displays.'],
        ['CullingMask', 'Filters rendering layers after screen routing.', 'Using it as a replacement for Top/Bottom entity placement.'],
        ['ProjectionType', 'Changes mesh projection only.', 'Assuming Orthographic hides meshes or Perspective hides sprites.']
      ] },
      { type: 'heading', text: 'Materials, textures and meshes' },
      { type: 'paragraph', text: 'MeshRendererComponent references an optional OBJ Mesh plus an optional Material list. An empty/unresolved Mesh falls back to MeshPrimitive. An imported mesh can contain submesh ranges; SceneRenderer resolves one material per range and emits one DrawMesh call for each range. One material entry covers all ranges; multiple entries are index-matched and unspecified ranges receive the default white unlit material.' },
      { type: 'list', items: ['Material is a reusable .mat JSON asset with Color, Texture and Shading Mode. MaterialLoader returns a default material on missing/invalid data rather than failing a frame.', 'MaterialLoader::SetRuntime replaces a material only in the process-local cache: it is suitable for a Behaviour animating Color each Update, does not write the .mat or romfs, and affects every renderer sharing that material path. MaterialInstance isolation is a later feature.', 'AssetRef contains a GUID. AssetDatabase maps the GUID to a project path on desktop or a cooked romfs manifest path on device.', 'IRenderer2D::LoadTexture and IRenderer3D::LoadTexture maintain separate backend caches. Handle 0 means no texture; the draw uses flat color or a safe fallback.', 'IRenderer3D::LoadMesh uploads imported vertex data and returns a backend-local handle. Imported handles and built-in MeshPrimitive values use separate storage.', 'UnloadAllTextures and UnloadAllMeshes are scene-transition operations. They invalidate backend handles and must never run while an active render pass still references them.'] },
      { type: 'heading', text: 'Sort and transparency policy' },
      { type: 'paragraph', text: 'Sprite render order is deterministic and explicitly driven by SortOrder, then scene/hierarchy order for ties. That rule is appropriate for 2D composition. Meshes are depth-tested and current material data is unlit/opaque; their visible order should be driven by camera depth, not hierarchy sibling order. A future transparent mesh queue must sort back-to-front and disable depth writes while retaining depth tests.' },
      { type: 'callout', tone: 'warning', title: 'Renderer extension rule', text: 'Do not add raw GPU calls to a Behaviour or to SceneRenderer. Extend IRenderer2D/IRenderer3D or introduce a renderer-owned RenderView/DrawItem data type, then implement the same contract in OpenGL and Citro backends.' }
    ]
  },
  {
    id: 'physics-deep-dive', group: 'Engine systems', title: 'Physics deep dive: 2D, 3D, units and callbacks',
    summary: 'How Box2D and Bullet are integrated into Scene runtime without leaking backend ownership into gameplay code.',
    tags: ['physics', 'box2d', 'bullet', 'collision', 'units'],
    blocks: [
      { type: 'heading', text: 'Two worlds, one gameplay convention' },
      { type: 'paragraph', text: 'Duality runs a Box2D world for 2D bodies and a Bullet discrete dynamics world for 3D bodies. They are separate simulations with separate shape sets, but components share project world units, BodyType concepts, gravity settings, layer/hierarchy activity and Behaviour callback semantics. A game must choose which dimension owns an object instead of attaching unrelated 2D and 3D physics to the same gameplay problem.' },
      { type: 'table', headers: ['Concern', '2D', '3D'], rows: [
        ['Backend', 'Box2D v2.4 API.', 'Bullet btDiscreteDynamicsWorld.'],
        ['Bodies', 'Rigidbody2DComponent with opaque RuntimeBody.', 'Rigidbody3DComponent with opaque RuntimeBody and RuntimeCollisionShape.'],
        ['Supported authoring shapes', 'Box, circle, capsule approximation and convex polygon.', 'Box, sphere and capsule.'],
        ['Queries', 'Physics2D::Raycast returns RaycastHit2D.', 'Physics3D::Raycast and ScreenPointToRay return 3D data.'],
        ['Triggers', 'Native Box2D sensor fixtures.', 'No-contact-response Bullet collision objects while manifolds remain observable.']
      ] },
      { type: 'heading', text: 'Units and project settings' },
      { type: 'paragraph', text: 'PhysicsUnits is the single conversion boundary. PPU controls the authored sprite/world relationship; PhysicsUnits::ToPhysics and ToWorld convert values handed to a backend. Gravity remains an authored world-units-per-second-squared value and is converted consistently. Scripts should express speed, jump force and collider size in project world units rather than screen pixels or backend-specific metres.' },
      { type: 'list', items: ['Changing PPU changes how imported sprite pixels map to world scale; it does not automatically repair existing scene transforms or magic numbers in gameplay scripts.', 'Collider Size fields are half-extents where documented. A box Size of {0.5, 0.5} spans one world unit in each 2D axis.', 'Mass equal to zero means derive/use backend static behaviour according to the component BodyType and shape data. Do not use zero mass as a hidden disable flag.', 'RuntimeBody and RuntimeFixture are opaque engine-owned pointers. They exist only between Scene::OnRuntimeStart and OnRuntimeStop and are never serialised or accessed directly by game code.'] },
      { type: 'heading', text: 'Runtime synchronization and structural changes' },
      { type: 'code', language: 'text', code: 'Play start\n  ├─ read authored Rigidbody/Collider/Transform components\n  ├─ create backend body and fixture/shape\n  └─ store opaque runtime handles in components\n\nEach runtime step\n  ├─ synchronize authored transform -> kinematic/static body where applicable\n  ├─ step Box2D and Bullet worlds\n  ├─ synchronize dynamic body -> TransformComponent\n  └─ diff contact pairs -> Behaviour collision/trigger callbacks\n\nPlay stop / entity destruction\n  └─ destroy backend objects before scene component memory disappears' },
      { type: 'paragraph', text: 'Adding, removing or editing a collider/body at runtime is a structural operation. Systems must recreate or update the corresponding backend object at a safe point outside an active simulation step. This is why script code should use wrappers such as Rigidbody2D and Collider2D rather than retain backend pointers.' },
      { type: 'heading', text: 'Contact callback contract' },
      { type: 'table', headers: ['Condition', 'Callback', 'Guarantee'], rows: [
        ['A non-trigger pair begins/ends contact', 'OnCollisionEnter / OnCollisionExit on both entities.', 'other is the opposing Entity.'],
        ['Either collider is trigger and pair begins/ends contact', 'OnTriggerEnter / OnTriggerExit on both entities.', 'A pair produces trigger or collision callbacks, never both.'],
        ['Pair remains touching', 'No Stay callback in current contract.', 'Gameplay stores its own contact state when continuous behaviour is required.'],
        ['Entity inactive or script disabled', 'No gameplay callback while inactive/disabled.', 'Engine still owns safe backend cleanup.']
      ] },
      { type: 'callout', tone: 'warning', title: 'Safe gameplay pattern', text: 'Treat Entity values from a collision or raycast as potentially stale after you destroy an entity, load a scene or change hierarchy. Test entity truthiness and reacquire components with TryGetComponent before acting.' },
      { type: 'heading', text: 'Raycasts and pointer interaction' },
      { type: 'paragraph', text: 'Physics raycasts are queries, not rendering. Physics2D::Raycast takes world-space origin/direction and returns a hit entity, point, normal and distance. Physics3D adds ScreenPointToRay, which uses the active camera to construct a world ray. PhysicsRaycaster2DComponent or PhysicsRaycaster3DComponent is the bridge from pointer input to IPointer event interfaces; a Rigidbody is not required merely to receive a pointer click.' }
    ]
  },
  {
    id: 'citro3d-deep-dive', group: 'Nintendo 3DS', title: 'Citro3D deep dive: GPU frame, targets and shader state',
    summary: 'The exact native 3DS rendering lifecycle Duality must preserve when evolving its platform renderer.',
    tags: ['citro3d', 'pica200', 'c3d', 'shader', 'linear memory'],
    blocks: [
      { type: 'heading', text: 'Global GPU lifetime' },
      { type: 'paragraph', text: 'Citro3D is process-global state. DualityPlayer, not Citro2DRenderer or Citro3DRenderer, owns C3D_Init, the one C3D_FrameBegin/C3D_FrameEnd bracket per hardware frame and C3D_Fini. Both renderer backends are guests inside that bracket. Creating a second bracket from a game package or renderer helper is a state-corruption bug, not an optimization.' },
      { type: 'table', headers: ['Call / object', 'Owner in Duality', 'Lifetime rule'], rows: [
        ['C3D_Init / C3D_Fini', 'DualityPlayer application entry.', 'Once for the process; finish renderer resources before C3D_Fini.'],
        ['C3D_FrameBegin / C3D_FrameEnd', 'DualityPlayer frame loop.', 'Exactly once for a hardware frame containing both screen renders.'],
        ['C2D_CreateScreenTarget', 'Citro2DRenderer.', 'Creates physical-screen targets shared non-owningly with Citro3DRenderer.'],
        ['C3D_RenderTarget*', 'Citro2DRenderer owns; Citro3DRenderer receives SetScreenTargets.', 'Citro3DRenderer must never destroy or replace these targets.'],
        ['DVLB / shaderProgram_s', 'Citro3DRenderer.', 'Parse/init at backend Init; free before C3D_Fini.'],
        ['linearAlloc vertex buffers', 'Citro3DRenderer.', 'Allocate once for primitive/imported mesh cache; linearFree on unload/shutdown.'],
        ['C3D_Tex cache', 'Citro3DRenderer.', 'One-based renderer-local handles; C3D_TexDelete before cache clear.']
      ] },
      { type: 'heading', text: 'Screen targets and depth' },
      { type: 'paragraph', text: 'Citro3DRenderer draws to Citro2D-created targets so 2D and 3D content for a physical screen compose onto exactly the same display target. BeginScene selects Top/Bottom target, clears color only when necessary, always clears depth for a new mesh pass, then calls C3D_FrameDrawOn. PICA200 uses the reversed-depth convention in this backend: GPU_GREATER depth testing is enabled for meshes and disabled again before Citro2D work.' },
      { type: 'list', items: ['Perspective uses Mtx_PerspTilt with FOV converted through C3D_AngleFromDegrees.', 'Orthographic uses Mtx_OrthoTilt with a Y-down arrangement that matches Duality 2D screen composition.', 'View is the inverse of the camera world transform; model is composed as Translation × RotationZ × RotationY × RotationX × Scale.', 'C3D_Mtx layout differs from GLM. IRenderer3D passes decomposed camera/model values specifically to avoid byte-copying matrices between incompatible conventions.', 'The mesh pass must restore/avoid leaking depth, shader and texture environment state before Citro2D draws.'] },
      { type: 'heading', text: 'Vertex shader and attribute contract' },
      { type: 'paragraph', text: 'The current mesh.v.pica vertex shader is intentionally unlit. Attribute v0 is position, v1 is texture coordinate and v2 is a fixed draw color set by C3D_FixedAttribSet. It outputs clip position, UV and color. Texture blending is configured by C3D_TexEnv: MODULATE combines texture and color, while REPLACE yields flat primary color when texture handle is zero.' },
      { type: 'code', language: 'text', code: 'Current draw state\n  C3D_BindProgram(shaderProgram)\n  AttrInfo_AddLoader(v0, float3 position)\n  AttrInfo_AddLoader(v1, float2 uv)\n  AttrInfo_AddFixed(v2, color)\n  BufInfo_Add(vertexBuffer, sizeof(MeshVertex), 2 attributes, ...)\n  C3D_FVUnifMtx4x4(projection)\n  C3D_FVUnifMtx4x4(modelView)\n  C3D_TexBind(0, tex) + C3D_TexEnv...\n  C3D_DrawArrays(GPU_TRIANGLES, firstVertex, vertexCount)' },
      { type: 'callout', tone: 'warning', title: 'Lighting migration requirement', text: 'Vertex lighting changes this contract: MeshVertex needs normals, the shader needs a normal attribute plus light uniforms, and both AttrInfo/BufInfo stride declarations must change in lockstep for OpenGL and Citro3D. Do not update only the shader or only the OBJ importer.' },
      { type: 'heading', text: 'Texture cooking, sampler state and memory' },
      { type: 'paragraph', text: 'The device backend expects cooked .t3x data at a romfs path, not arbitrary JPG or PNG at runtime. Tex3DS_TextureImport creates C3D_Tex from the cooked bytes. Import settings determine point/bilinear sampling, clamp/repeat wrapping and whether mip filtering can be used. Texture paths are cached, including failures, so a missing asset does not repeatedly allocate/read every frame.' },
      { type: 'list', items: ['Use linearAlloc only for GPU-visible linear allocations such as uploaded vertex buffers; pair every allocation with exactly one linearFree.', 'Avoid duplicating a large texture in both 2D and 3D backend caches unless the asset genuinely appears in both paths. This is an optimization target, not a reason to share unsafe raw C3D_Tex ownership today.', 'Mipmaps reduce distant texture shimmer on 3D surfaces but increase cooked texture memory. Enable them per texture after checking hardware VRAM/linear-memory budget.', 'Display-transfer anti-aliasing is chosen at output transfer/build configuration. It is independent from texture filtering, mipmaps, lighting and shadows.'] },
      { type: 'heading', text: 'Debugging native rendering failures' },
      { type: 'table', headers: ['Symptom', 'First checks'], rows: [
        ['Mesh disappears after 2D draws', 'Verify Citro3D program/attributes/textures are rebound before every mesh draw and Citro2D prepares its own state before 2D draws.'],
        ['Wrong clear color', 'Check C3D clear packing order, not Citro2D color packing.'],
        ['Depth looks inverted', 'Check GPU_GREATER and depth clear value; do not copy desktop GPU_LESS defaults.'],
        ['Texture works in editor but not device', 'Confirm cook manifest GUID path, .t3x conversion, romfs copy and import settings.'],
        ['Random crash after scene change', 'Audit C3D_TexDelete, linearFree and renderer cache clear order; never use a stale backend handle.']
      ] }
    ]
  },
  {
    id: 'additive-scenes', group: 'Core runtime', title: 'Scene loading: Single, Additive and unload',
    summary: 'Deferred, ordered scene transitions that keep a base world alive while overlay scenes update and render.',
    tags: ['scene', 'scenemanager', 'additive', 'loadscene', 'unloadscene', 'runtime'],
    blocks: [
      { type: 'heading', text: 'Runtime contract' },
      { type: 'paragraph', text: 'SceneManager is a deferred request API. A Behaviour may ask for a transition during OnUpdate, but the host consumes the ordered queue only after every loaded Scene finished that frame. This prevents the current callback from destroying its own Behaviour, Entity or physics world.' },
      { type: 'paragraph', text: 'Tiếng Việt: SceneManager là API yêu cầu chuyển Scene theo kiểu trì hoãn. Behaviour có thể yêu cầu trong OnUpdate, nhưng host chỉ xử lý hàng đợi sau khi tất cả Scene đã chạy xong frame. Nhờ vậy callback hiện tại không thể tự hủy Behaviour, Entity hoặc physics world của chính nó.' },
      { type: 'table', headers: ['Operation', 'Runtime result', 'Typical use'], rows: [
        ['LoadScene(path, Single)', 'Stops and releases the base scene plus every additive scene, then starts path as the new base.', 'Level transition, returning to title scene.'],
        ['LoadScene(path, Additive)', 'Deserializes and starts an independent Scene without stopping the current base. It updates and composites after previously loaded scenes.', 'HUD, transition overlay, streamed room or persistent service world.'],
        ['UnloadScene(path)', 'Stops and removes the matching additive Scene. The base Scene is intentionally retained.', 'Close an overlay, remove a streamed room.'],
        ['Several requests in one frame', 'Processed strictly in issuance order; no request overwrites another.', 'A transition coordinator issuing unload then additive load.']
      ] },
      { type: 'callout', tone: 'info', title: 'Rendering order', text: 'For each physical screen the base Scene clears once. Every additive Scene then renders with clear=false in load order, so later additive content appears above earlier scene content. Each Scene still applies its own cameras, culling masks, layers, sprite sort order and Canvas UI rules.' },
      { type: 'heading', text: 'Gameplay API' },
      { type: 'code', language: 'cpp', code: '#include <DualityEngine/Scripting/ScriptScene.h>\n\nusing namespace Duality;\n\n// Replace the full runtime scene set.\nScriptScene::LoadScene("Scenes/Level2.scene");\n\n// Keep the current gameplay scene and draw/update this overlay after it.\nScriptScene::LoadScene("Scenes/Hud.scene", LoadSceneMode::Additive);\n// Equivalent shorthand:\nScriptScene::LoadSceneAdditive("Scenes/Hud.scene");\n\n// Later, remove only the additive scene.\nScriptScene::UnloadScene("Scenes/Hud.scene");' },
      { type: 'callout', tone: 'warning', title: 'Use ScriptScene in Behaviour code', text: 'On desktop, GameScripts is a hot-reloaded DLL. ScriptScene routes requests through EngineServices to the host-owned queue, so use ScriptScene::LoadScene/UnloadScene from a Behaviour. SceneManager remains the low-level runtime/host API and is also valid for engine code or tests.' },
      { type: 'heading', text: 'Lifecycle, assets and editor behaviour' },
      { type: 'list', items: ['Every successfully loaded additive scene receives OnRuntimeStart before its first update, then OnRuntimeStop exactly once when it is unloaded, a Single transition occurs, Play stops, scripts reload, or the application exits.', 'Additive scenes are runtime-only in the editor. The Hierarchy continues to edit the primary authored Scene; leaving Play restores its pre-Play snapshot and removes all runtime additive scenes.', 'The 3DS and desktop players resolve request paths beneath their own cooked/project Assets root. Add all runtime-loadable scenes to Build Settings so their serialized assets are cooked into romfs.', 'Do not unload textures/meshes merely because one additive scene closes: other scenes can share them. Backend caches are released for a true Single transition or renderer shutdown.', 'For 2D overlays, later additive scenes naturally composite on top. Cross-scene 3D depth/camera composition should be treated as separate camera passes; keep an overlay UI/2D unless the intended camera ownership is explicit.'] },
      { type: 'heading', text: 'Design limits and safe patterns' },
      { type: 'paragraph', text: 'An Entity handle belongs to exactly one Scene. Do not parent an Entity across scenes, cache an Entity from an unloadable scene in a persistent Behaviour, or pass raw component pointers between scenes. Use events, ScriptableObject data, GUID asset references, or a dedicated persistent service scene for cross-scene communication.' },
      { type: 'paragraph', text: 'Tiếng Việt: Entity chỉ thuộc đúng một Scene. Không parent Entity giữa các Scene, không giữ Entity của Scene có thể unload trong Behaviour tồn tại lâu, và không truyền raw component pointer giữa các Scene. Hãy giao tiếp qua event, ScriptableObject, AssetRef GUID hoặc một service scene tồn tại lâu.' },
      { type: 'callout', tone: 'success', title: 'Test coverage', text: 'The engine test suite verifies the ordered request mailbox, Single/Additive mode retention, Unload targets, queue consumption, and an additive request issued from a Behaviour through the scripting service bridge. Real players apply the same queue after their full runtime update and before rendering.' }
    ]
  }
]

export const groups = [...new Set(docPages.map((page) => page.group))]
