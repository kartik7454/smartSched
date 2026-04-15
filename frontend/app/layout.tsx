import './globals.css'
import { Inter } from 'next/font/google'
import Header from '../componenets/header'

const inter = Inter({ subsets: ['latin'] })




export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  

  return (
    <html lang="en">
      <body className={inter.className}>
       
    <Header />

        {children}
      </body>
    </html>
  )
}