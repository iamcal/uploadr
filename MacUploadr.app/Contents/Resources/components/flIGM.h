/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM flIGM.idl
 */

#ifndef __gen_flIGM_h__
#define __gen_flIGM_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    UploadObserver */
#define UPLOADOBSERVER_IID_STR "038c001d-0575-4411-9e9c-b5535be068f3"

#define UPLOADOBSERVER_IID \
  {0x038c001d, 0x0575, 0x4411, \
    { 0x9e, 0x9c, 0xb5, 0x53, 0x5b, 0xe0, 0x68, 0xf3 }}

class NS_NO_VTABLE NS_SCRIPTABLE UploadObserver : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(UPLOADOBSERVER_IID)

  /* void onProgress (in long remaining, in short photoId); */
  NS_SCRIPTABLE NS_IMETHOD OnProgress(PRInt32 remaining, PRInt16 photoId) = 0;

  /* void onResponse (in AString rsp, in short photoId); */
  NS_SCRIPTABLE NS_IMETHOD OnResponse(const nsAString & rsp, PRInt16 photoId) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(UploadObserver, UPLOADOBSERVER_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_UPLOADOBSERVER \
  NS_SCRIPTABLE NS_IMETHOD OnProgress(PRInt32 remaining, PRInt16 photoId); \
  NS_SCRIPTABLE NS_IMETHOD OnResponse(const nsAString & rsp, PRInt16 photoId); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_UPLOADOBSERVER(_to) \
  NS_SCRIPTABLE NS_IMETHOD OnProgress(PRInt32 remaining, PRInt16 photoId) { return _to OnProgress(remaining, photoId); } \
  NS_SCRIPTABLE NS_IMETHOD OnResponse(const nsAString & rsp, PRInt16 photoId) { return _to OnResponse(rsp, photoId); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_UPLOADOBSERVER(_to) \
  NS_SCRIPTABLE NS_IMETHOD OnProgress(PRInt32 remaining, PRInt16 photoId) { return !_to ? NS_ERROR_NULL_POINTER : _to->OnProgress(remaining, photoId); } \
  NS_SCRIPTABLE NS_IMETHOD OnResponse(const nsAString & rsp, PRInt16 photoId) { return !_to ? NS_ERROR_NULL_POINTER : _to->OnResponse(rsp, photoId); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public UploadObserver
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_UPLOADOBSERVER

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, UploadObserver)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* void onProgress (in long remaining, in short photoId); */
NS_IMETHODIMP _MYCLASS_::OnProgress(PRInt32 remaining, PRInt16 photoId)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void onResponse (in AString rsp, in short photoId); */
NS_IMETHODIMP _MYCLASS_::OnResponse(const nsAString & rsp, PRInt16 photoId)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


/* starting interface:    flIGM */
#define FLIGM_IID_STR "0e0d0b74-2c06-11dc-8314-0800200c9a66"

#define FLIGM_IID \
  {0x0e0d0b74, 0x2c06, 0x11dc, \
    { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 }}

class NS_NO_VTABLE NS_SCRIPTABLE flIGM : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(FLIGM_IID)

  /* void init (in AString pwd, in UploadObserver observer); */
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd, UploadObserver *observer) = 0;

  /* AString thumb (in long square, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

  /* AString rotate (in long degrees, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) = 0;

  /* AString resize (in long square, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

  /* AString keyframe (in long square, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

  /* void upload (in short photoId, in AString version, in ACString preLoad, in AString path, in AString destination, in AString boundary); */
  NS_SCRIPTABLE NS_IMETHOD Upload(PRInt16 photoId, const nsAString & version, const nsACString & preLoad, const nsAString & path, const nsAString & destination, const nsAString & boundary) = 0;

  /* void cancel (in boolean bCancel); */
  NS_SCRIPTABLE NS_IMETHOD Cancel(PRBool bCancel) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(flIGM, FLIGM_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_FLIGM \
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd, UploadObserver *observer); \
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Upload(PRInt16 photoId, const nsAString & version, const nsACString & preLoad, const nsAString & path, const nsAString & destination, const nsAString & boundary); \
  NS_SCRIPTABLE NS_IMETHOD Cancel(PRBool bCancel); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_FLIGM(_to) \
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd, UploadObserver *observer) { return _to Init(pwd, observer); } \
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Thumb(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) { return _to Rotate(degrees, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Resize(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Keyframe(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Upload(PRInt16 photoId, const nsAString & version, const nsACString & preLoad, const nsAString & path, const nsAString & destination, const nsAString & boundary) { return _to Upload(photoId, version, preLoad, path, destination, boundary); } \
  NS_SCRIPTABLE NS_IMETHOD Cancel(PRBool bCancel) { return _to Cancel(bCancel); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_FLIGM(_to) \
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd, UploadObserver *observer) { return !_to ? NS_ERROR_NULL_POINTER : _to->Init(pwd, observer); } \
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Thumb(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Rotate(degrees, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Resize(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Keyframe(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Upload(PRInt16 photoId, const nsAString & version, const nsACString & preLoad, const nsAString & path, const nsAString & destination, const nsAString & boundary) { return !_to ? NS_ERROR_NULL_POINTER : _to->Upload(photoId, version, preLoad, path, destination, boundary); } \
  NS_SCRIPTABLE NS_IMETHOD Cancel(PRBool bCancel) { return !_to ? NS_ERROR_NULL_POINTER : _to->Cancel(bCancel); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class flGM : public flIGM
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_FLIGM

  flGM();

private:
  ~flGM();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(flGM, flIGM)

flGM::flGM()
{
  /* member initializers and constructor code */
}

flGM::~flGM()
{
  /* destructor code */
}

/* void init (in AString pwd, in UploadObserver observer); */
NS_IMETHODIMP flGM::Init(const nsAString & pwd, UploadObserver *observer)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString thumb (in long square, in AString path); */
NS_IMETHODIMP flGM::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString rotate (in long degrees, in AString path); */
NS_IMETHODIMP flGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString resize (in long square, in AString path); */
NS_IMETHODIMP flGM::Resize(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString keyframe (in long square, in AString path); */
NS_IMETHODIMP flGM::Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void upload (in short photoId, in AString version, in ACString preLoad, in AString path, in AString destination, in AString boundary); */
NS_IMETHODIMP flGM::Upload(PRInt16 photoId, const nsAString & version, const nsACString & preLoad, const nsAString & path, const nsAString & destination, const nsAString & boundary)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void cancel (in boolean bCancel); */
NS_IMETHODIMP flGM::Cancel(PRBool bCancel)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_flIGM_h__ */
