export type Block =
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
        ['Scene panel', 'Top/Bottom 2D and 3D authoring views. 2D is an editing aid, not a different render system; sprites remain drawable in 3D views as quads.'],
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
      { type: 'callout', tone: 'warning', title: 'Design document — not implemented yet', text: 'The current renderer is deliberately unlit. This page records the intended public data model and system boundaries before engine code changes begin.' },
      { type: 'paragraph', text: 'Duality should use a small forward pipeline on both desktop and Nintendo 3DS. A frame renders meshes first, then sprites, then Canvas UI into the same physical screen target. Lighting applies only to opt-in 3D materials; SpriteRenderer, UIImage, UIText and UIButton remain unlit so existing 2D games keep their exact visual behaviour.' },
      { type: 'table', headers: ['Rejected approach', 'Why it does not fit 3DS', 'Chosen alternative'], rows: [
        ['Deferred rendering', 'Several G-buffers consume VRAM and fill rate; lighting would require an additional fullscreen pass.', 'Single forward mesh pass with bounded light data.'],
        ['PBR with many maps', 'Material texture bandwidth and shader complexity are excessive for PICA200.', 'Albedo texture/color plus ambient, Lambert diffuse and optional low-cost specular.'],
        ['Unlimited dynamic lights', 'Per-object/per-vertex work becomes unpredictable and impossible to budget.', 'One directional light and a capped, camera-selected point-light list.'],
        ['Shadow maps as baseline', 'Extra depth target, render pass and filtering are costly and fragile on Old 3DS.', 'Blob/contact shadows first; baked/static lighting second; shadow maps remain experimental.']
      ] },
      { type: 'paragraph', text: 'The central rule is that the scene renderer owns rendering decisions, while platform backends own GPU implementation. Game scripts author Lights and Materials; they never call Citro3D frame APIs or manage C3D render targets.' },
      { type: 'code', language: 'cpp', code: '// Proposed renderer-facing data. Names are illustrative until implemented.\nstruct RenderView {\n    CameraData Camera;\n    glm::vec3 AmbientColor;\n    DirectionalLightData MainLight;\n    std::array<PointLightData, 4> PointLights;\n    uint32_t PointLightCount = 0;\n};\n\n// SceneRenderer builds this once per camera/screen.\nrenderer.BeginScene(view, clearColor, clear);\nrenderer.DrawMesh(drawItem);' },
      { type: 'list', items: ['Build a RenderView once for every enabled primary camera and physical screen.', 'Collect mesh draw items only after layer/culling-mask filtering and frustum culling.', 'Resolve material and mesh assets before sorting; opaque items sort front-to-back to improve depth rejection.', 'Transparent mesh items sort back-to-front. They do not write depth, but still depth-test.', 'Bind only the state needed by each draw; Citro2D/Citro3D global state must be re-established at pipeline boundaries.', 'End the mesh pass before beginning the existing 2D sprite and UI passes.'] },
      { type: 'callout', tone: 'success', title: 'Compatibility promise', text: 'An existing .mat missing all new fields remains Unlit and therefore keeps today’s Color + Texture result. Existing scenes and cooked assets must load without migration errors.' }
    ]
  },
  {
    id: 'lighting-data-model', group: 'Future architecture', title: 'Proposed lights, materials and mesh data',
    summary: 'The serialised component and asset model required for controllable, portable vertex lighting.',
    tags: ['proposal', 'material', 'directional light', 'point light', 'normal'],
    blocks: [
      { type: 'paragraph', text: 'The first rendering milestone needs normals before it needs shadows. Current OBJ import supports positions and UVs but not vn normal data; the 3DS shader currently receives position and UV plus a fixed vertex color. The mesh format, procedural primitives, desktop backend and Citro3D backend must gain the same normal attribute in one compatible change.' },
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
      { type: 'paragraph', text: 'Shadows should be a quality feature, not a renderer prerequisite. The game’s baseline must work in Unlit and VertexLit modes. Each higher tier is optional and has a well-defined visual payoff, memory cost and test target.' },
      { type: 'table', headers: ['Tier', 'Technique', 'Cost / benefit', 'Initial status'], rows: [
        ['Unlit', 'Current Color + Texture material path', 'Cheapest; exact compatibility mode.', 'Existing baseline'],
        ['VertexLit', 'Ambient + directional/selected point lights at vertex level', 'Strong form readability with no extra render target.', 'First implementation milestone'],
        ['VertexLit + Blob', 'Soft projected quad/sprite below selected dynamic objects', 'Very low cost contact cue; no depth map.', 'Second milestone'],
        ['Baked static', 'Lightmap or baked vertex colors for environment', 'Excellent quality/runtime cost trade-off for static levels.', 'Design/import pipeline milestone'],
        ['Shadow map', 'Low-resolution directional depth pass', 'High complexity/VRAM; requires filtering and projection management.', 'Experimental, disabled by default']
      ] },
      { type: 'paragraph', text: 'Blob shadows should be authored as a controlled renderer feature, not as a one-off sprite in every prefab. A ShadowCasterComponent can expose enabled, local offset, radius, opacity and ground layer. The renderer projects it only when an eligible receiver/ground rule is met, then draws it in the transparent 3D/2.5D queue.' },
      { type: 'code', language: 'cpp', code: 'enum class LightingQuality {\n    Unlit,\n    VertexLit,\n    VertexLitBlobShadows\n};\n\n// Proposed Build Settings / Project Settings data.\nstruct RenderSettings {\n    LightingQuality Lighting = LightingQuality::VertexLit;\n    glm::vec3 AmbientColor{ 0.18f };\n    int MaxPointLights = 4; // Clamp to the hardware-safe budget.\n};' },
      { type: 'list', items: ['Expose Lighting Quality in Project Settings and permit a 3DS Build Settings override. Anti-aliasing/display-transfer selection stays independent.', 'Old 3DS validation uses the lowest supported lighting tier, normal gameplay scene, worst-case light overlap and both screens active.', 'New 3DS may raise a documented point-light cap only after profiling; game content must never depend on that higher cap.', 'Show renderer diagnostics in editor: mesh draw calls, visible mesh count, culled count, selected point lights, blob shadow count and estimated texture/linear-memory usage.', 'Use Citra for iteration, then verify frame time and memory on real Old 3DS hardware before declaring a tier supported.'] },
      { type: 'callout', tone: 'warning', title: 'Shadow-map gate', text: 'Do not start a shadow-map implementation until vertex lighting, RenderView, render queues, frustum culling and blob shadows are stable and measured. If static/baked lighting answers the game’s visual need, shadow maps should remain unnecessary.' }
    ]
  }
]

export const groups = [...new Set(docPages.map((page) => page.group))]
