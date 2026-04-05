# RunPod LLM Hosting Setup Guide

## Overview

This guide covers deploying the `wellness-chat` Llama 8B model on RunPod for demo/MVP use.

**Infrastructure:**
- **GPU:** NVIDIA RTX A5000 (24 GB VRAM)
- **Template:** Ollama NVIDIA CUDA (`ollama/ollama:latest`)
- **Network Volume:** `wellness-llm-storage` (20 GB)
- **Cost:** ~$0.27/hr (on-demand) + $1.40/mo volume storage

---

## First-Time Setup (Already Done)

1. Created a RunPod account
2. Added SSH public key (`~/.ssh/id_ed25519.pub`) to RunPod settings
3. Created Network Volume `wellness-llm-storage` (20 GB, EU-SE-1)
4. Uploaded `wellness-llama-8b-Q4_K_M.gguf` to the network volume at `/workspace/`
5. Created `/workspace/Modelfile` on the volume

---

## Deploy a New Pod (Every Time)

### Step 1: Create Pod

1. Go to [RunPod Console](https://www.runpod.io/console/pods)
2. Click **+ Deploy**
3. Select **GPU:** RTX A5000 (or similar with 24GB VRAM)
4. Select **Template:** `Ollama NVIDIA CUDA` (`ollama/ollama:latest`)
5. Configure:
   - **Container Disk:** 20 GB
   - **Network Volume:** Select `wellness-llm-storage`
   - **SSH terminal access:** Checked
   - **Encrypt volume:** Checked
   - **Jupyter notebook:** Unchecked
6. Click **Deploy On-Demand**

### Step 2: Connect via SSH

Wait for the pod to show a green dot (1-3 minutes), then:

```bash
ssh <pod-id>@ssh.runpod.io -i ~/.ssh/id_ed25519
```

The SSH command is found in the pod's **Connect** tab.

### Step 3: Create the Ollama Model

```bash
ollama create wellness-chat -f /workspace/Modelfile
```

This takes ~10 seconds since the GGUF is already on disk.

### Step 4: Test the Model

```bash
ollama run wellness-chat "I've been feeling really stressed about my exams"
```

### Step 5: Get the Public API URL

1. Go to pod's **Connect** tab
2. Copy the **Port 11434** URL (looks like `https://<pod-id>-11434.proxy.runpod.net`)
3. Update `AI-Wrapper-Service/AIWrapperService/appsettings.json`:

```json
"OpenAI": {
    "BaseUrl": "https://<pod-id>-11434.proxy.runpod.net/v1/"
}
```

### Step 6: Verify API Endpoint

```bash
curl https://<pod-id>-11434.proxy.runpod.net/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"wellness-chat","messages":[{"role":"user","content":"hello"}]}'
```

---

## Shut Down (After Demo)

1. Go to RunPod dashboard
2. Click **Terminate** on the pod (this is expected with Network Volumes - there is no "Stop" option)
3. Your model files are safe on the network volume

**Note:** Terminate only destroys the container. Your GGUF model and Modelfile persist on the `wellness-llm-storage` network volume.

---

## Quick Reference

| Action | Command / Step |
|--------|---------------|
| SSH into pod | `ssh <pod-id>@ssh.runpod.io -i ~/.ssh/id_ed25519` |
| Create model | `ollama create wellness-chat -f /workspace/Modelfile` |
| Test model | `ollama run wellness-chat "test message"` |
| List models | `ollama list` |
| Terminate pod | RunPod dashboard > Terminate |

---

## Cost Breakdown

| Item | Cost |
|------|------|
| RTX A5000 on-demand | $0.27/hr |
| Network volume (20 GB) | $1.40/mo (always) |
| Running 2 hrs/day | ~$16/mo + $1.40 |
| Running 4 hrs/day | ~$33/mo + $1.40 |

---

## Troubleshooting

- **SSH times out on direct IP:** Use the `ssh <pod-id>@ssh.runpod.io` command instead of SSH over TCP
- **`ollama` command not found:** Pod may still be starting. Wait 1-2 minutes
- **Model not found after redeploy:** Run `ollama create wellness-chat -f /workspace/Modelfile` again
- **API URL changed:** The URL changes every deploy. Update `appsettings.json` with the new URL from the Connect tab
