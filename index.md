---
layout: default
title: Cynthia's Homepage
lang: en
resume_lang: en
---
# Hi, I'm Zhixin Zhu

I'm a Computer Science undergraduate at Sun Yat-sen University with research interests in **Machine Learning Systems (MLSys)**, especially focus on **model inference optimization**.
Currently a member of the **Supercomputing Team** at Sun Yat-sen University, experienced with **C++**, **Python**, **CUDA**, and **MPI** programming.

---

## Education

- **Ph.D. in Computer Science and Technology(Incoming)**, Sun Yat-sen University *(2027 Expected)*
- **B.S. in Computer Science and Technology**, Sun Yat-sen University *(Aug 2023 – June 2027 Expected)*
  - **GPA: 3.8 / 4.0**
  - Coursework: Artificial Intelligence; Machine Learning; Optimization Theory; Data Structures and Algorithms; Mathematical Analysis I & II

---

## Internship Experience

- **Tencent Holdings Limited — Backend Development Intern** *(Mar 2026 – Jun 2026)*

  - Investigated performance optimization for an internal TensorFlow-to-PyTorch recommendation-model training framework using deep-learning compilers and distributed primitives.
  - Profiled and evaluated the experimental thread-safe, GIL-protected `torch.compile`; aligned environments, upgraded PyTorch, and identified open-source compiler bugs limiting runtime speedup.
  - Diagnosed distributed-training bottlenecks with PyTorch Profiler and designed an adaptive gradient-accumulation mechanism across multiple GPU execution steps to reduce collective-communication overhead.
  - Demonstrated that embedding-layer operations, rather than standalone `all_reduce` operations, dominated communication latency in this workload.
- **Sponge Lab, HKUST — Research Intern** *(Feb 2026 – Aug 2026)*

  - Accelerated Vision-Language-Action models and embodied-AI control policies through model compression, unstructured pruning, and low-precision quantization.
  - Ported the proposed token-pruning framework to the World Action Model setup with the autoregressive DreamZero architecture to study its transferability.
  - Evaluated KIVI-style KV-cache quantization in `cosmos-policy` and established its incompatibility with non-autoregressive control policies, which lack KV-cache structures.
  - Implemented 2:4 structured sparsity in `Lingbot-Map` to improve Tensor Core compute throughput.

---

## Research & Projects

- **Optimization of `code_saturne` — ISC 2025 Student Cluster Competition** *(Mar 2025 – May 2025)*

  - Addressed communication bottlenecks by comparing MPI implementations and minimizing disk I/O.
  - Achieved a **2.7× performance improvement** for the LES_AIR_QUALITY case on Bridges 2.
  - Fixed GPU runtime errors and identified architectural redesign as necessary for further scalability.
- **Optimization of `llama.cpp` — ISC 2026 Student Cluster Competition** *(Mar 2026 – Jun 2026)*

  - Implemented data parallelism across multi-GPU and multi-core CPU servers, achieving near-linear scalability through balanced workloads.
  - Developed custom Mixture-of-Experts kernel fusion strategies to reduce memory bandwidth bottlenecks and kernel launch overhead.
  - Improved tensor-parallel efficiency on multi-node systems through parameter tuning and communication–computation overlap.
- **vLLM-Ascend Sampler — Huawei ICT Competition 2026** *(Nov 2025 – Jan 2026)*

  - Identified performance bottlenecks in Top-K / Top-P sampling during LLM inference on Ascend NPUs.
  - Implemented Triton-based fused sampling kernels to reduce kernel launches and memory access overhead.
  - Reduced latency by up to **1.88%** compared with the native Ascend 910 implementation.
- **Relative Camera Pose Estimation** *(Sep 2025 – Feb 2026)*

  - Designed a minimal solver for relative pose estimation using point correspondences and surface normals.
  - Evaluated its robustness and efficiency across several benchmarks.

---

## Awards

- 🥇 **ISC 2025 Student Cluster Competition — 1st Place Online Winner**
- 🎓 **2023–2025 Sun Yat-sen University Scholarship**

---

## Languages & Technologies

- **Languages**: English (CET-6: 544); Mandarin (Native); Cantonese (Native)
- **Programming**: Python, C/C++, OpenMP, MPI, CUDA
- **Systems & Tools**: Linux, GDB, CMake, Performance Profiling & Benchmarking, Docker
