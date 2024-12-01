import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import NotFound from '../../404/404'
import Navbar from '../../layout/navbar'
import { Helmet } from 'react-helmet-async'
import loading from '../../../utilities/loading'
import LoadingScreen from '../../templates/base/loading'
import EditorSidebar from './edit-sidebar'
import EditorNavbar from './edit-navbar'

function BlogPost() { 
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loadingState, setLoadingState] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const handleLoading = async () => {
      await Promise.all([loading(['/css/blog-post.css']), new Promise(resolve => setTimeout(resolve, 500))])

      try {
        const response = await fetch('/api/posts')
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const posts = await response.json()
        const matchedPost = posts.find(p => p.slug === slug)

        if (matchedPost) {
          setPost(matchedPost)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        setNotFound(true)
      } finally {
        setLoadingState(false)  
      }
    }

    handleLoading()
  }, [slug])

  if (loadingState) {
    return <LoadingScreen />
  }

  if (notFound) {
    return <NotFound />
  }

  return (
    <>   
      <Helmet>
        <title>{post.title}</title>
        <link rel="stylesheet" href="/css/edit-post.css" />
      </Helmet>
      <Navbar />
      <main className="main">
        <EditorNavbar key={post._id} post={post}/>
        <EditorSidebar/>
        <div className="editor-container">
          <div className="editor">
              <div className="editor__back">
                  <a href="/dashboard/posts">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Dashboard</span>
                  </a>
              </div>
           </div>
          <div className="post">
            <div className="post__inner">
              <div className="post__inner__content">
                <div className="item item-img">
                  <img src={post.imageUrl} alt={post.title} />
                </div>
                <div className="post__inner__content__header">
                  <div className="item item-header">
                    <header>{post.title}</header>
                  </div>
                </div>
                <div className="post__inner__content__description">
                  <div className="item item-text">
                    <p>{post.description}</p>
                  </div>
                  <div className="item item-text">
                    <p>test</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default BlogPost
