# Movie Application (TMDB Movie Search)

A modern movie search web application built with **Next.js 15** that integrates **The Movie Database (TMDB) API** to display movie results with posters, release dates, genres, and descriptions. The application focuses on a clean UI, responsive layout, and category-based filtering (including Kids & Family movies).

## Features

* ✅ Movie search using TMDB API
* ✅ Displays movie poster, title, release date, overview
* ✅ Genre tags (Action, Drama, Kids, Family, etc.)
* ✅ Kids/Family movie filtering
* ✅ Responsive 2-column card layout
* ✅ Placeholder image fallback for missing posters
* ✅ Server-side data fetching via Next.js App Router
* ✅ Optimized images with next/image
* ✅ Ready for deployment on Vercel


## Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **UI Library:** Ant Design (antd)
* **API:** TMDB (The Movie Database)
* **Image Optimization:** next/image
* **Date Formatting:** date-fns
* **Version Control:** Git & GitHub
* **Deployment:** Vercel


### Development Tools

* **eslint** – Linting
* **husky** – Git hooks management
* **lint-staged** – Pre-commit linting


## Deployment

The project is deployed using **Vercel**.
To deploy:

1. Push changes to GitHub
2. Connect repo to Vercel
3. Add environment variable `TMDB_ACCESS_TOKEN`
4. Click Deploy 🚀
