function SiteFooter() {
  return (
    <footer className="container z-40 flex h-8 items-center gap-2 py-2">
      Play Later {new Date().getFullYear()}
    </footer>
  )
}

export { SiteFooter }
