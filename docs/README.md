# README

## Overview

This folder holds all the source files related to the documentation site. The site is a static website hosted by GitHub Pages. The rendering is handled by Hugo via a GitHub actions workflow. Hugo has a development server for use whilst updating documentation allowing you to preview your changes ahead of pushing them upstream.

## Update Go Modules (Theme)
```sh
hugo mod get -u
hugo mod tidy
```

## Commands

- Start Hugo dev server: `hugo server --disableFastRender`