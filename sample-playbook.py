#!/usr/bin/env python3
"""
Generate a sample playbook PDF for testing The Thrifty Pigeon.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os

def create_sample_playbook():
    """Create a sample playbook PDF."""

    filename = "sample-playbook.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Container for the 'Flowable' objects
    elements = []

    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#0f172a',
        spaceAfter=30,
        alignment=TA_CENTER,
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor='#0f172a',
        spaceAfter=12,
        spaceBefore=12,
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        textColor='#1e293b',
        alignment=TA_JUSTIFY,
        spaceAfter=12,
    )

    # Title page
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("Your First Dollar Playbook", title_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("A Step-by-Step Guide to Making Money Online", body_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("The Thrifty Pigeon", body_style))
    elements.append(PageBreak())

    # Introduction
    elements.append(Paragraph("Introduction", heading_style))
    elements.append(Paragraph(
        "Welcome to Your First Dollar Playbook! This guide will walk you through the exact steps "
        "to start making money online, even if you're starting from zero.",
        body_style
    ))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        "Inside this playbook, you'll discover practical strategies that have helped thousands of "
        "people earn their first dollar online. Whether you're looking to start freelancing, "
        "selling digital products, or offering services, this playbook has you covered.",
        body_style
    ))

    # Chapter 1
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Chapter 1: Finding Your First Opportunity", heading_style))
    elements.append(Paragraph(
        "The key to making your first dollar is identifying opportunities that match your skills "
        "and interests. Here's a systematic approach to finding your first paying opportunity:",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Step 1: Inventory Your Skills</b><br/>"
        "Take 15 minutes to write down everything you know how to do. Don't overthink it—include "
        "both professional skills and hobbies. Can you write? Design? Code? Organize? Teach? "
        "Each skill is a potential income source.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Step 2: Research Market Demand</b><br/>"
        "Visit freelancing platforms like Upwork, Fiverr, and Freelancer. Search for services "
        "related to your skills. Look at what's in demand, what people are charging, and what "
        "successful sellers are offering.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Step 3: Start Small and Specific</b><br/>"
        "Don't try to be everything to everyone. Pick one specific service you can deliver "
        "confidently. For example, instead of 'graphic design,' start with 'Instagram story "
        "templates' or 'logo design for tech startups.'",
        body_style
    ))

    # Chapter 2
    elements.append(PageBreak())
    elements.append(Paragraph("Chapter 2: Creating Your First Offer", heading_style))
    elements.append(Paragraph(
        "Now that you've identified an opportunity, it's time to package it into an irresistible "
        "offer that gets you your first paying customer.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Crafting Your Offer</b><br/>"
        "Your offer should be clear, specific, and valuable. Include exactly what the customer "
        "will receive, how long it will take, and what results they can expect. Price your first "
        "few offers competitively to build reviews and testimonials.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Setting Up Your Profile</b><br/>"
        "Create professional profiles on at least two platforms. Use a clear headshot, write a "
        "compelling bio focused on customer benefits, and showcase any relevant work samples "
        "or portfolio pieces.",
        body_style
    ))

    # Chapter 3
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Chapter 3: Landing Your First Customer", heading_style))
    elements.append(Paragraph(
        "Getting your first customer requires proactive outreach and clear communication. "
        "Here's your action plan:",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Day 1-2: Set Up and Optimize</b><br/>"
        "Create your profiles, write compelling service descriptions, and set competitive prices. "
        "Make sure your profiles are complete and professional.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Day 3-7: Active Outreach</b><br/>"
        "Send 10-15 personalized proposals daily to relevant job postings. Avoid generic templates—"
        "read each job carefully and explain specifically how you can help. Aim for a 70% response "
        "rate by being genuinely helpful.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Day 8-14: Follow Up and Refine</b><br/>"
        "Follow up with interested prospects. Refine your approach based on responses. By day 14, "
        "you should have at least 2-3 serious conversations with potential customers.",
        body_style
    ))

    # Conclusion
    elements.append(PageBreak())
    elements.append(Paragraph("Conclusion: Your Path Forward", heading_style))
    elements.append(Paragraph(
        "Making your first dollar online is a milestone that opens doors to unlimited potential. "
        "The strategies in this playbook are proven and practical—now it's time to take action.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "Remember: every successful online entrepreneur started exactly where you are now. The "
        "difference is they took action. Start today, stay consistent, and your first dollar "
        "will lead to many more.",
        body_style
    ))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        "Good luck on your journey!<br/><br/>— The Thrifty Pigeon Team",
        body_style
    ))

    # Build PDF
    doc.build(elements)
    print(f"✅ Sample playbook PDF created: {filename}")
    print(f"📍 Location: {os.path.abspath(filename)}")
    print(f"\nYou can now upload this file to Cloudflare R2 with the key:")
    print(f"   playbooks/first-dollar-v1.pdf")

if __name__ == "__main__":
    try:
        create_sample_playbook()
    except ImportError:
        print("❌ Error: reportlab library not found")
        print("\nInstall it with:")
        print("   pip3 install reportlab")
